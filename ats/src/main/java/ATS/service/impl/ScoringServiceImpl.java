package ATS.service.impl;

import ATS.dto.*;
import ATS.dto.RankingFilter;
import ATS.dto.RankingItem;
import ATS.entities.*;
import ATS.enums.CVStatus;
import ATS.repository.CVRepository;
import ATS.repository.JobRepository;
import ATS.repository.MatchResultRepository;
import ATS.service.JobService;
import ATS.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

/**
 * Điều phối chấm CV theo tiêu chí JD và lưu căn cứ để HR xem lại.
 * Điểm kỹ năng dùng độ bao phủ có trọng số, điểm kinh nghiệm dùng TF-IDF/Cosine,
 * điểm học vấn dùng quy tắc văn bản trong educationMatch().
 *
 * Các hàm ghi dữ liệu chạy trong transaction. Nếu một CV gây lỗi khi ghi,
 * toàn bộ lượt rescore rollback để tránh lưu một phần kết quả của lượt chấm.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ScoringServiceImpl implements ScoringService {
    // Phiên bản giúp phân biệt kết quả của công thức hiện tại với điểm cũ.
    // JobServiceImpl đặt algorithmVersion = null khi tiêu chí thay đổi để yêu cầu chấm lại.
    private static final String VERSION = ScoringService.ALGORITHM_VERSION;
    // Chỉ chấm khi CV đã có dữ liệu phân tích, đồng thời cho phép chấm lại hồ sơ đã duyệt.
    private static final Set<CVStatus> READY = EnumSet.of(CVStatus.PARSED, CVStatus.SCORED, CVStatus.REVIEWED);
    private final JobRepository jobs;
    private final CVRepository cvs;
    private final MatchResultRepository results;
    private final JobService jobService;
    private final JsonMapper json;

    @Override
    public RescoreResult rescore(Long jobId, Long userId) {
        // Kiểm tra quyền sở hữu và khóa JD trong lượt chấm.
        // Các API sửa tiêu chí cũng khóa cùng dòng JD, nên tiêu chí được giữ nhất quán.
        Job job = jobs.findOwnedForUpdate(jobId, userId).orElseThrow(this::notFound);
        return score(job, false);
    }

    @Override
    public RescoreResult scorePending(Long jobId, Long userId) {
        Job job = jobs.findOwnedForUpdate(jobId, userId).orElseThrow(this::notFound);
        if (job.getStatus() != ATS.enums.JobStatus.OPEN) {
            return RescoreResult.builder().jobId(jobId).totalCvs(0).updatedCvs(0).failedCvs(0).message("JD đã đóng").build();
        }
        return score(job, true);
    }

    private RescoreResult score(Job job, boolean onlyPending) {
        Long jobId=job.getJobId();
        validateJob(job);
        // Khóa các CV theo thứ tự ID để các lượt chấm cùng JD được xử lý tuần tự.
        List<CVs> candidates = cvs.findAllForScoring(jobId);
        int updated = 0;
        for (CVs cv : candidates) {
            if (!READY.contains(cv.getStatus())) {
                // CV đang chờ, đang phân tích hoặc phân tích lỗi được tính là bỏ qua.
                continue;
            }
            // Chấm tự động chỉ xử lý CV mới hoặc điểm đã cũ; không ghi lại CV còn điểm hợp lệ.
            if (onlyPending && current(cv.getMatchResult())) continue;
            MatchDetailResponse detail = calculate(job, cv);
            MatchResult result = cv.getMatchResult();
            // Tái sử dụng bản ghi cũ khi chấm lại. Quan hệ cv_id là duy nhất trong DB.
            if (result == null) {
                result = new MatchResult();
                result.setCv(cv);
                cv.setMatchResult(result);
            }
            // Trường cũ jaccardScore hiện chứa điểm độ bao phủ có trọng số.
            // DTO trả thêm tên skillScore để phía gọi API đọc theo ý nghĩa mới.
            result.setJaccardScore(detail.getSkillScore());
            result.setCosineScore(detail.getCosineScore());
            result.setEducationScore(detail.getEducationScore());
            result.setOverallScore(detail.getOverallScore());
            result.setPassedHardFilter(detail.getPassedHardFilter());
            result.setCalculatedAt(detail.getCalculatedAt());
            result.setAlgorithmVersion(VERSION);
            // Lưu bản chụp điểm và căn cứ tại thời điểm chấm.
            // Khi xem chi tiết, đọc bản chụp này thay vì tính lại theo JD đang được chỉnh sửa.
            result.setDetailsJson(json.writeValueAsString(detail));
            results.save(result);
            if (cv.getStatus() != CVStatus.REVIEWED) {
                // Giữ dấu mốc HR đã duyệt hồ sơ khi cập nhật điểm.
                cv.setStatus(CVStatus.SCORED);
            }
            updated++;
        }
        // failedCvs = 0 vì lỗi phát sinh sẽ rollback và trả exception.
        // Các CV chưa đủ trạng thái được đếm riêng trong message.
        return RescoreResult.builder().jobId(jobId).totalCvs(candidates.size()).updatedCvs(updated)
                .failedCvs(0).message("Scored " + updated + "; skipped unparsed/failed CVs: "
                        + (candidates.size() - updated)).build();
    }

    /** Kiểm tra cả dữ liệu cũ trong DB, kể cả khi dữ liệu đã từng qua API cấu hình. */
    private void validateJob(Job job) {
        if (job.getRequiredSkills().isEmpty()) {
            throw badRequest("JD phải có ít nhất một kỹ năng trước khi chấm điểm");
        }
        // add() trả false khi ID đã tồn tại trong tập, dùng để phát hiện kỹ năng JD bị trùng.
        Set<Long> ids = new HashSet<>();
        for (JobRequiredSkill required : job.getRequiredSkills()) {
            if (required.getSkill() == null || required.getSkill().getSkillId() == null
                    || !ids.add(required.getSkill().getSkillId())) {
                throw badRequest("Kỹ năng JD không hợp lệ hoặc trùng ID");
            }
            weight(required);
        }
        double sum = 0;
        for (double value : new double[]{job.getW1(), job.getW2(), job.getW3()}) {
            if (!Double.isFinite(value) || value < 0 || value > 1) {
                throw badRequest("Trọng số tổng phải nằm trong [0, 1]");
            }
            sum += value;
        }
        // Dùng sai số nhỏ vì phép cộng số thực có thể lệch nhẹ so với 1.
        if (Math.abs(sum - 1) > 0.000001) {
            throw badRequest("Tổng ba trọng số phải bằng 1");
        }
        if (job.getMinExperienceYears() < 0) {
            throw badRequest("Số năm kinh nghiệm tối thiểu không hợp lệ");
        }
    }

    /** Dữ liệu trước khi có cột weight có thể còn null, mặc định mỗi kỹ năng có trọng số 1. */
    private double weight(JobRequiredSkill skill) {
        double value = skill.getWeight() == null ? 1.0 : skill.getWeight();
        if (!Double.isFinite(value) || value <= 0) {
            throw badRequest("Trọng số kỹ năng phải hữu hạn và lớn hơn 0");
        }
        return value;
    }

    /** Tính kết quả từ entity đã nạp. Việc ghi DB được thực hiện trong rescore(). */
    private MatchDetailResponse calculate(Job job, CVs cv) {
        // NLP đã chuẩn hóa alias thành skillId. Set đảm bảo một kỹ năng xuất hiện
        // nhiều lần trong CV vẫn chỉ được tính một lần.
        Set<Long> available = cv.getCvSkills().stream()
                .filter(item -> item.getSkill() != null && item.getSkill().getSkillId() != null)
                .map(item -> item.getSkill().getSkillId()).collect(Collectors.toSet());
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> mandatory = new ArrayList<>();
        // Công thức coverage = tổng trọng số skill JD có trong CV / tổng trọng số skill JD.
        // Ví dụ JD có Java=3, Spring Boot=3, Docker=2. Có Java và Spring Boot thì đạt 6/8.
        // Chia cả tử và mẫu cho trọng số lớn nhất giữ nguyên tỷ lệ, tránh tràn số khi cộng.
        double scale = job.getRequiredSkills().stream().mapToDouble(this::weight).max().orElseThrow();
        double numerator = 0;
        double denominator = 0;
        for (JobRequiredSkill required : job.getRequiredSkills()) {
            double normalizedWeight = weight(required) / scale;
            // Mọi skill JD đều đóng góp vào mẫu số, kể cả kỹ năng ưu tiên.
            denominator += normalizedWeight;
            String name = required.getSkill().getCanonicalName();
            if (available.contains(required.getSkill().getSkillId())) {
                numerator += normalizedWeight;
                matched.add(name);
            } else {
                missing.add(name);
                if (required.isMandatory()) {
                    mandatory.add(name);
                }
            }
        }
        double coverage = numerator / denominator;
        // Chỉ duyệt skill JD nên các kỹ năng CV có thêm ngoài yêu cầu không ảnh hưởng điểm.
        // mandatory là điều kiện lọc riêng, còn weight quyết định mức đóng góp vào coverage.
        List<String> reasons = new ArrayList<>();
        if (!mandatory.isEmpty()) {
            reasons.add("Thiếu kỹ năng bắt buộc: " + String.join(", ", mandatory));
        }
        double experienceYears = experienceYears(cv);
        if (experienceYears < job.getMinExperienceYears()) {
            reasons.add("Chưa xác nhận đủ " + job.getMinExperienceYears() + " năm kinh nghiệm");
        }
        double education = educationMatch(job, cv);
        if (education < 1 && job.getEducationRequirements() != null && !job.getEducationRequirements().isBlank()) {
            reasons.add("Chưa xác nhận đáp ứng yêu cầu học vấn");
        }
        // Số năm kinh nghiệm phục vụ lọc cứng. Nội dung công việc phục vụ điểm tương đồng.
        String experience = cv.getExperiences().stream().map(item ->
                Objects.toString(item.getJobTitle(), "") + " " + Objects.toString(item.getDescription(), ""))
                .collect(Collectors.joining(" "));
        double cosine = TextSimilarity.cosine(job.getDescription(), experience);
        // w1, w2, w3 là trọng số của ba nhóm tiêu chí, khác với weight của từng skill.
        // Điểm thành phần và điểm tổng dùng thang 0..1, giữ độ chính xác trong lúc tính.
        double total = job.getW1() * coverage + job.getW2() * cosine + job.getW3() * education;
        // Vẫn lưu điểm của CV không qua lọc cứng để HR xem căn cứ.
        // passedHardFilter chỉ đúng khi không còn lý do loại nào.
        return MatchDetailResponse.builder().cvId(cv.getCvId()).jobId(job.getJobId())
                .candidateName(cv.getCandidateName()).jaccardScore(coverage).cosineScore(cosine)
                .educationScore(education).overallScore(Math.min(1, total)).passedHardFilter(reasons.isEmpty())
                .matchedSkills(matched).missingSkills(missing).missingMandatorySkills(mandatory)
                .hardFilterReasons(reasons).matchedSkillCount(matched.size())
                .totalRequiredSkills(job.getRequiredSkills().size()).calculatedAt(LocalDateTime.now())
                .weights(new MatchDetailResponse.Weights(job.getW1(), job.getW2(), job.getW3()))
                .skillBreakdown(job.getRequiredSkills().stream().map(r -> new MatchDetailResponse.SkillBreakdown(
                        r.getSkill().getSkillId(), r.getSkill().getCanonicalName(), r.isMandatory(), weight(r),
                        available.contains(r.getSkill().getSkillId()))).toList())
                .experienceYears(experienceYears).requiredExperienceYears(job.getMinExperienceYears())
                .educationRequirements(job.getEducationRequirements())
                .algorithmVersion(VERSION).build();
    }

    /** Cộng thời gian làm việc sau khi hợp nhất các khoảng giao nhau. */
    private double experienceYears(CVs cv) {
        LocalDate today = LocalDate.now();
        List<LocalDate[]> ranges = new ArrayList<>();
        for (CVExperience experience : cv.getExperiences()) {
            LocalDate start = experience.getStartDate();
            LocalDate end = Boolean.TRUE.equals(experience.getCurrent()) ? today : experience.getEndDate();
            // Công việc hiện tại kết thúc ở hôm nay. Bỏ khoảng thiếu ngày hoặc đảo ngược,
            // đồng thời giới hạn ngày kết thúc tương lai ở hôm nay.
            if (start != null && end != null && !start.isAfter(end) && !start.isAfter(today)) {
                ranges.add(new LocalDate[]{start, end.isAfter(today) ? today : end});
            }
        }
        // Sắp theo ngày bắt đầu rồi gộp khoảng giao nhau.
        // Hai công việc làm song song trong một năm chỉ đóng góp một năm vào tổng.
        ranges.sort(Comparator.comparing(range -> range[0]));
        double years = 0;
        LocalDate start = null;
        LocalDate end = null;
        for (LocalDate[] range : ranges) {
            if (start == null) {
                start = range[0];
                end = range[1];
            } else if (!range[0].isAfter(end)) {
                if (range[1].isAfter(end)) {
                    end = range[1];
                }
            } else {
                years += durationYears(start, end);
                start = range[0];
                end = range[1];
            }
        }
        if (start != null) {
            years += durationYears(start, end);
        }
        return years;
    }

    // Tính tháng lịch đầy đủ trước để một khoảng đúng hai năm đạt chính xác 2.0.
    // Phần ngày dư được quy đổi gần đúng theo 365.2425 ngày/năm.
    private double durationYears(LocalDate start, LocalDate end) {
        long months = ChronoUnit.MONTHS.between(start, end);
        return months / 12.0 + ChronoUnit.DAYS.between(start.plusMonths(months), end) / 365.2425;
    }

    private double educationMatch(Job job, CVs cv) {
        var requiredLevel = ATS.enums.EducationLevel.parse(job.getEducationRequirements());
        if (requiredLevel.isPresent()) {
            if (requiredLevel.get() == ATS.enums.EducationLevel.NONE) return 1;
            // Chỉ xét bằng cấp, không suy ra cấp học từ tên trường hay chuyên ngành.
            // Bằng đang học/dự kiến tốt nghiệp chưa được coi là đã đạt trình độ đó.
            return cv.getEducations().stream()
                    .filter(e -> !ATS.enums.EducationLevel.unfinished(e.getDegree())
                            && !ATS.enums.EducationLevel.unfinished(e.getSourceText()))
                    .map(e -> ATS.enums.EducationLevel.parse(e.getDegree()).orElse(ATS.enums.EducationLevel.NONE))
                    .anyMatch(level -> level.meets(requiredLevel.get())) ? 1 : 0;
        }
        String requirement = normalized(job.getEducationRequirements());
        if (requirement.isBlank()) {
            // JD không yêu cầu học vấn thì xem tiêu chí này là đáp ứng.
            return 1;
        }
        // Tương thích JD cũ có yêu cầu văn bản/chuyên ngành chưa thuộc danh mục cấp học.
        for (CVEducation education : cv.getEducations()) {
            String text = normalized(Objects.toString(education.getDegree(), "") + " "
                    + Objects.toString(education.getFieldOfStudy(), ""));
            if (text.contains(requirement)) {
                return 1;
            }
        }
        return 0;
    }

    /** Chuẩn hóa học vấn bằng cách bỏ dấu, chuyển chữ thường và gộp khoảng trắng. */
    private String normalized(String text) {
        if (text == null) {
            return "";
        }
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replace('đ', 'd').replaceAll("\\s+", " ").strip();
    }

    @Override
    @Transactional(readOnly = true)
    public MatchDetailResponse getMatchDetail(Long cvId, Long userId) {
        // Truy vấn kiểm tra CV thuộc người dùng. Kết quả cũ hoặc bị vô hiệu hóa cần chấm lại.
        MatchResult result = results.findDetail(cvId, userId).orElseThrow(this::notFound);
        if (!current(result)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kết quả cũ cần được chấm lại");
        }
        return json.readValue(result.getDetailsJson(), MatchDetailResponse.class);
    }

    @Override
    public ScoringConfigResponse updateConfig(Long jobId, ScoringConfigRequest config, Long userId) {
        // Dùng chung kiểm tra trọng số và cơ chế vô hiệu hóa điểm cũ của module JD.
        return jobService.updateConfig(jobId, config, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RankingItem> getRanking(Long jobId, Long userId, RankingFilter filter, Pageable pageable) {
        // Kiểm tra quyền trước khi đọc điểm của JD.
        jobs.findByJobIdAndUserId(jobId, userId).orElseThrow(this::notFound);
        RankingFilter options = filter == null ? new RankingFilter() : filter;
        if (options.getQuery() != null && options.getQuery().length() > 255) {
            throw badRequest("Từ khóa tìm kiếm tối đa 255 ký tự");
        }
        if (pageable.isPaged() && pageable.getPageSize() > 100) {
            throw badRequest("Mỗi trang tối đa 100 CV");
        }
        String query = normalized(options.getQuery());
        validateRange(options.getMinScore());
        validateRange(options.getMaxScore());
        if (options.getMinScore() != null && options.getMaxScore() != null
                && options.getMinScore() > options.getMaxScore()) {
            throw badRequest("Điểm tối thiểu lớn hơn điểm tối đa");
        }
        // JACCARD là tên tham số cũ, SKILL là tên dùng cho độ bao phủ có trọng số.
        String sortBy = options.getSortBy() == null ? "OVERALL_SCORE" : options.getSortBy().toUpperCase(Locale.ROOT);
        ToDoubleFunction<MatchResult> value = switch (sortBy) {
            case "OVERALL_SCORE" -> MatchResult::getOverallScore;
            case "SKILL", "JACCARD" -> MatchResult::getJaccardScore;
            case "COSINE" -> MatchResult::getCosineScore;
            case "EDUCATION" -> MatchResult::getEducationScore;
            default -> throw badRequest("Trường sắp xếp không hợp lệ");
        };
        String order = options.getSortOrder() == null ? "DESC" : options.getSortOrder().toUpperCase(Locale.ROOT);
        if (!Set.of("ASC", "DESC").contains(order)) {
            throw badRequest("Chiều sắp xếp phải là ASC hoặc DESC");
        }
        Comparator<MatchResult> scoreOrder = Comparator.comparingDouble(value);
        if (order.equals("DESC")) {
            scoreOrder = scoreOrder.reversed();
        }
        // Ưu tiên nhóm qua lọc cứng, sau đó áp dụng điểm và chiều sắp xếp được chọn.
        // Khi bằng điểm, ưu tiên điểm kỹ năng cao hơn, nộp sớm hơn, cuối cùng là ID CV.
        Comparator<MatchResult> ordering = Comparator.comparing(MatchResult::isPassedHardFilter).reversed()
                .thenComparing(scoreOrder).thenComparing(Comparator.comparingDouble(MatchResult::getJaccardScore).reversed())
                .thenComparing(item -> item.getCv().getUploadedAt()).thenComparing(item -> item.getCv().getCvId());
        // Lọc kết quả đúng phiên bản và CV có trạng thái hợp lệ.
        // Bộ lọc minScore/maxScore luôn áp dụng trên điểm tổng, dù đang sắp theo điểm thành phần.
        List<MatchResult> ranked = results.findAllByJob(jobId).stream()
                .filter(this::current)
                .filter(item -> options.getReviewStatus() == null || item.getCv().getHrReviewStatus() == options.getReviewStatus())
                .filter(item -> options.getPassedHardFilter() == null || item.isPassedHardFilter() == options.getPassedHardFilter())
                .filter(item -> query.isEmpty() || normalized(Objects.toString(item.getCv().getCandidateName(), "") + " "
                        + Objects.toString(item.getCv().getEmail(), "") + " " + item.getCv().getCvId()).contains(query))
                .filter(item -> options.getMinScore() == null || item.getOverallScore() >= options.getMinScore())
                .filter(item -> options.getMaxScore() == null || item.getOverallScore() <= options.getMaxScore())
                .sorted(ordering).toList();
        // Phiên bản hiện tại lọc và sắp xếp trong bộ nhớ rồi phân trang.
        // rank là thứ tự trong danh sách đã lọc, vẫn ưu tiên nhóm qua lọc cứng.
        long offset = pageable.isPaged() ? pageable.getOffset() : 0;
        int from = (int) Math.min(offset, ranked.size());
        int size = pageable.isPaged() ? pageable.getPageSize() : Math.max(1, ranked.size());
        int to = (int) Math.min((long) from + size, ranked.size());
        List<RankingItem> content = new ArrayList<>();
        for (int index = from; index < to; index++) {
            MatchResult result = ranked.get(index);
            CVs cv = result.getCv();
            RankingItem item = new RankingItem(cv.getCvId(), jobId, result.getOverallScore(), result.getJaccardScore(),
                    result.getCosineScore(), result.getEducationScore(), cv.getCandidateName(), cv.getEmail(), index + 1);
            item.setPassedHardFilter(result.isPassedHardFilter());
            item.setReviewStatus(cv.getHrReviewStatus());
            content.add(item);
        }
        return PageResponse.<RankingItem>builder().content(content).pageNumber(pageable.isPaged() ? pageable.getPageNumber() : 0)
                .pageSize(size).totalElements((long) ranked.size()).totalPages((ranked.size() + size - 1) / size)
                .isFirst(offset == 0).isLast(to == ranked.size()).build();
    }

    private boolean current(MatchResult result) {
        return result != null && VERSION.equals(result.getAlgorithmVersion()) && result.getDetailsJson() != null
                && !result.getDetailsJson().isBlank() && READY.contains(result.getCv().getStatus());
    }

    @Override
    @Transactional(readOnly = true)
    public ScoringStatusResponse getScoringStatus(Long jobId, Long userId) {
        Job job = jobs.findByJobIdAndUserId(jobId, userId).orElseThrow(this::notFound);
        int ready = 0, valid = 0, unscored = 0, stale = 0, pending = 0, parsing = 0, failed = 0, passed = 0;
        for (CVs cv : job.getCvs()) {
            if (cv.getStatus() == CVStatus.PENDING) pending++;
            else if (cv.getStatus() == CVStatus.PARSING) parsing++;
            else if (cv.getStatus() == CVStatus.PARSED_FAILED) failed++;
            if (!READY.contains(cv.getStatus())) continue;
            ready++;
            if (cv.getMatchResult() == null) unscored++;
            else if (!current(cv.getMatchResult())) stale++;
            else {
                valid++;
                if (cv.getMatchResult().isPassedHardFilter()) passed++;
            }
        }
        return new ScoringStatusResponse(jobId, job.getCvs().size(), ready, valid, unscored, stale,
                pending, parsing, failed, passed, valid - passed, VERSION);
    }

    private void validateRange(Double score) {
        if (score != null && (!Double.isFinite(score) || score < 0 || score > 1)) {
            throw badRequest("Bộ lọc điểm phải nằm trong [0, 1]");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu thuộc người dùng");
    }
}
