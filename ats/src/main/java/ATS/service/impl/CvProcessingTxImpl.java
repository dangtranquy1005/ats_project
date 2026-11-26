package ATS.service.impl;

import ATS.dto.*;
import ATS.entities.*;
import ATS.enums.*;
import ATS.repository.*;
import ATS.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.time.*;
import java.util.*;

/**
 * Transaction ngắn cho từng CV. Worker gọi NlpClient giữa prepareRequest và saveResult,
 * bên ngoài transaction. Token ngăn phản hồi cũ ghi đè lần xử lý mới sau khi phục hồi.
 */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.REQUIRES_NEW)
public class CvProcessingTxImpl implements CvProcessingTx {
    private final CVRepository cvs;
    private final SkillRepository skills;
    private final NlpSkillDictionary dictionary;
    private final NlpResultMapper mapper;
    private final JsonMapper json;

    @Override
    public boolean claim(Long cvId) {
        return start(cvId, false).isPresent();
    }

    @Override
    public Optional<AnalyzeRequest> claimRequest(Long cvId) {
        return start(cvId, false).map(this::requestFor);
    }

    @Override
    public Optional<AnalyzeRequest> claimPendingRequest(Long cvId) {
        return start(cvId, true).map(this::requestFor);
    }

    private Optional<CVs> start(Long cvId, boolean pendingOnly) {
        Optional<CVs> found = cvs.findLocked(cvId);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        CVs cv = found.get();
        if ((pendingOnly && cv.getStatus() != CVStatus.PENDING)
                || cv.getStatus() == CVStatus.PARSING || cv.getPdfProcessingToken() != null
                || cv.getRawText() == null || cv.getRawText().isBlank()) {
            return Optional.empty();
        }
        cv.setNlpProcessingToken(UUID.randomUUID().toString());
        cv.setNlpProcessingStartedAt(LocalDateTime.now());
        cv.setStatus(CVStatus.PARSING);
        cv.setErrorMessage(null);
        invalidateScore(cv);
        return Optional.of(cv);
    }

    @Override
    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public AnalyzeRequest prepareRequest(Long cvId) {
        CVs cv = cvs.findById(cvId).orElseThrow(this::notFound);
        if (cv.getStatus() != CVStatus.PARSING || cv.getNlpProcessingToken() == null) {
            throw conflict("Cần claim bước NLP trước khi chuẩn bị request");
        }
        return requestFor(cv);
    }

    private AnalyzeRequest requestFor(CVs cv) {
        return AnalyzeRequest.builder().cvId(cv.getCvId()).rawText(cv.getRawText()).fileType("pdf")
                .languageHint("auto").skillDictionary(dictionary.snapshot())
                .processingToken(cv.getNlpProcessingToken()).build();
    }

    @Override
    public void saveResult(Long cvId, AnalyzeResponse response) {
        CVs cv = cvs.findLocked(cvId).orElseThrow(this::notFound);
        if (response == null || !Objects.equals(cvId, response.getCvId())
                || !ownsTask(cv, response.getProcessingToken())) {
            throw conflict("Phản hồi NLP sai cvId hoặc thuộc tác vụ đã hết hiệu lực");
        }
        if (response.getSkills() == null || response.getExperiences() == null || response.getEducations() == null) {
            throw conflict("Phản hồi NLP thiếu danh sách kết quả");
        }
        // Kiểm tra toàn bộ ID và tạo dữ liệu mới trước khi thay thế dữ liệu cũ.
        Map<Long, AnalyzeResponse.Skill> extracted = new LinkedHashMap<>();
        for (AnalyzeResponse.Skill item : response.getSkills()) {
            if (item == null || item.skillId() == null
                    || (item.matchMethod() != MatchMethod.EXACT && item.matchMethod() != MatchMethod.ALIAS)) {
                throw conflict("Kỹ năng cần ID thật và phương thức EXACT hoặc ALIAS");
            }
            extracted.merge(item.skillId(), item,
                    (old, incoming) -> incoming.matchMethod() == MatchMethod.EXACT ? incoming : old);
        }
        Map<Long, Skills> known = new HashMap<>();
        skills.findAllById(extracted.keySet()).forEach(skill -> known.put(skill.getSkillId(), skill));
        if (!known.keySet().containsAll(extracted.keySet())) {
            throw conflict("Từ điển đã thay đổi, có skillId không còn tồn tại");
        }
        List<CVExperience> experiences = response.getExperiences().stream()
                .map(item -> mapper.toExperience(Objects.requireNonNull(item, "Kinh nghiệm null"), cv)).toList();
        List<CVEducation> educations = response.getEducations().stream()
                .map(item -> mapper.toEducation(Objects.requireNonNull(item, "Học vấn null"), cv)).toList();
        String raw = response.getRawNlpResult();
        if (raw == null || raw.isBlank()) {
            raw = json.writeValueAsString(response);
        } else if (!json.readTree(raw).isObject()) {
            throw conflict("rawNlpResult phải là JSON object");
        }

        // Flush phần xóa trước khi thêm để tránh va chạm unique(cv_id, skill_id).
        // Nếu bước ghi sau lỗi, transaction rollback khôi phục cả dữ liệu cũ.
        cv.getCvSkills().clear();
        cv.getExperiences().clear();
        cv.getEducations().clear();
        cvs.flush();
        for (AnalyzeResponse.Skill item : extracted.values()) {
            CVSkills target = new CVSkills();
            target.setCv(cv);
            target.setSkill(known.get(item.skillId()));
            target.setMatchMethod(item.matchMethod());
            cv.getCvSkills().add(target);
        }
        cv.getExperiences().addAll(experiences);
        cv.getEducations().addAll(educations);
        AnalyzeResponse.Person person = response.getPerson();
        cv.setCandidateName(firstPresent(response.getCandidateName(), person == null ? null : person.name(), cv.getCandidateName()));
        cv.setEmail(firstPresent(response.getEmail(), person == null ? null : person.email(), cv.getEmail()));
        cv.setPhone(firstPresent(response.getPhone(), person == null ? null : person.phone(), cv.getPhone()));
        cv.setRawNlpResult(raw);
        cv.setErrorMessage(null);
        cv.setStatus(CVStatus.PARSED);
        clearTask(cv);
        invalidateScore(cv);
        cvs.saveAndFlush(cv);
    }

    @Override
    public void markFailed(Long cvId, String token, String reason) {
        cvs.findLocked(cvId).filter(cv -> ownsTask(cv, token)).ifPresent(cv -> {
            cv.setStatus(CVStatus.PARSED_FAILED);
            String message = firstPresent(reason, "Phân tích NLP thất bại");
            cv.setErrorMessage(message.substring(0, Math.min(250, message.length())));
            clearTask(cv);
            invalidateScore(cv);
        });
    }

    @Override
    public int resetStaleProcessing(Instant before) {
        LocalDateTime cutoff = LocalDateTime.ofInstant(before, ZoneId.systemDefault());
        int count = 0;
        for (Long id : cvs.findStaleNlpIds(cutoff)) {
            CVs cv = cvs.findLocked(id).orElse(null);
            if (cv != null && cv.getStatus() == CVStatus.PARSING && cv.getNlpProcessingToken() != null
                    && cv.getNlpProcessingStartedAt() != null && cv.getNlpProcessingStartedAt().isBefore(cutoff)) {
                cv.setStatus(CVStatus.PENDING);
                clearTask(cv);
                count++;
            }
        }
        return count;
    }

    @Override
    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Long> findStalePendingIds(Instant before) {
        return cvs.findPendingNlpIds(LocalDateTime.ofInstant(before, ZoneId.systemDefault()));
    }

    private boolean ownsTask(CVs cv, String token) {
        return token != null && token.equals(cv.getNlpProcessingToken()) && cv.getStatus() == CVStatus.PARSING
                && cv.getPdfProcessingToken() == null;
    }

    private void clearTask(CVs cv) {
        cv.setNlpProcessingToken(null);
        cv.setNlpProcessingStartedAt(null);
        cv.setUpdatedAt(LocalDateTime.now());
    }

    private void invalidateScore(CVs cv) {
        if (cv.getMatchResult() != null) {
            cv.getMatchResult().setAlgorithmVersion(null);
        }
    }

    private String firstPresent(String... candidates) {
        for (String value : candidates) {
            if (value != null && !value.isBlank()) {
                return value.strip();
            }
        }
        return null;
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy CV");
    }
}
