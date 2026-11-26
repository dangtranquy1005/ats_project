package ATS.service.impl;

import ATS.dto.*;
import ATS.entities.*;
import ATS.enums.JobStatus;
import ATS.repository.JobRepository;
import ATS.repository.SkillRepository;
import ATS.repository.UserRepository;
import ATS.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class JobServiceImpl implements JobService {
    private final JobRepository jobs;
    private final SkillRepository skills;
    private final UserRepository users;

    private Job owned(Long jobId, Long userId) {
        return jobs.findByJobIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy JD"));
    }

    private Job ownedForUpdate(Long jobId, Long userId) {
        return jobs.findOwnedForUpdate(jobId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy JD"));
    }

    @Override
    public JobResponse createJob(JobRequest request, Long userId) {
        Job job = new Job();
        job.setUser(users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)));
        job.setW1(0.5);
        job.setW2(0.3);
        job.setW3(0.2);
        apply(job, request);
        jobs.saveAndFlush(job);
        if (request.getRequiredSkills() != null) {
            replaceSkills(job, request.getRequiredSkills());
        } else if (request.getRequiredSkillIds() != null) {
            replaceSkills(job, request.getRequiredSkillIds().stream().map(this::skillRequest).toList());
        }
        return response(job);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobSummaryResponse> listJobsByUserId(Long userId, Pageable pageable) {
        return jobs.findByUserId(userId, pageable).map(job -> JobSummaryResponse.builder()
                .jobId(job.getJobId()).title(job.getTitle()).status(job.getStatus())
                .createdAt(job.getCreatedAt()).totalApplications(job.getCvs().size()).build());
    }

    @Override
    @Transactional(readOnly = true)
    public JobDetailResponse getJob(Long jobId, Long userId) {
        Job job = owned(jobId, userId);
        return JobDetailResponse.builder().jobId(job.getJobId()).title(job.getTitle())
                .description(job.getDescription()).minExperienceYears(job.getMinExperienceYears())
                .educationRequirements(job.getEducationRequirements()).status(job.getStatus())
                .userId(userId).createdAt(job.getCreatedAt()).updatedAt(job.getUpdatedAt())
                .requiredSkills(skillResponses(job)).totalApplications(job.getCvs().size()).build();
    }

    @Override
    public JobResponse updateJob(Long jobId, JobRequest request, Long userId) {
        Job job = ownedForUpdate(jobId, userId);
        apply(job, request);
        if (request.getRequiredSkills() != null) {
            replaceSkills(job, request.getRequiredSkills());
        } else if (request.getRequiredSkillIds() != null) {
            replaceSkills(job, request.getRequiredSkillIds().stream().map(this::skillRequest).toList());
        }
        return response(job);
    }

    private void apply(Job job, JobRequest request) {
        if (request.getRequiredSkills() != null && request.getRequiredSkillIds() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ gửi một danh sách kỹ năng");
        }
        if (request.getTitle() == null || request.getTitle().isBlank() || request.getTitle().strip().length() > 255
                || (request.getMinExperienceYears() != null && request.getMinExperienceYears() < 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên JD hoặc số năm kinh nghiệm không hợp lệ");
        }
        job.setTitle(request.getTitle().strip());
        job.setDescription(request.getDescription());
        if (request.getMinExperienceYears() != null) {
            job.setMinExperienceYears(request.getMinExperienceYears());
        }
        job.setEducationRequirements(ATS.enums.EducationLevel.canonicalRequirement(request.getEducationRequirements()));
        invalidateScores(job);
    }

    @Override
    public JobResponse changeStatus(Long jobId, JobStatus status, Long userId) {
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu trạng thái JD");
        }
        Job job = ownedForUpdate(jobId, userId);
        job.setStatus(status);
        return response(job);
    }

    @Override
    public void deleteJob(Long jobId, Long userId) {
        Job job = ownedForUpdate(jobId, userId);
        // Xóa trên giao diện là đóng JD. Giữ nguyên CV, kỹ năng và kết quả chấm đã lưu.
        // Khóa JD dùng chung với upload/chấm điểm để trạng thái được cập nhật nhất quán.
        job.setStatus(JobStatus.CLOSED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobSkillResponse> getRequiredSkills(Long jobId, Long userId) {
        return skillResponses(owned(jobId, userId));
    }

    @Override
    public JobResponse replaceRequiredSkills(Long jobId, List<JobSkillRequest> items, Long userId) {
        Job job = ownedForUpdate(jobId, userId);
        replaceSkills(job, items);
        return response(job);
    }

    private JobSkillRequest skillRequest(Long id) {
        JobSkillRequest request = new JobSkillRequest();
        request.setSkillId(id);
        return request;
    }

    private void replaceSkills(Job job, List<JobSkillRequest> items) {
        if (items == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu danh sách kỹ năng");
        }
        Set<Long> ids = new HashSet<>();
        for (JobSkillRequest item : items) {
            if (item == null || item.getSkillId() == null || !ids.add(item.getSkillId())
                    || item.getMandatory() == null || item.getWeight() == null
                    || !Double.isFinite(item.getWeight()) || item.getWeight() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỹ năng trùng hoặc trọng số không hợp lệ");
            }
            Skills skill = skills.findById(item.getSkillId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỹ năng không tồn tại"));
            JobRequiredSkill required = job.getRequiredSkills().stream()
                    .filter(existing -> existing.getSkill().getSkillId().equals(item.getSkillId()))
                    .findFirst().orElseGet(() -> {
                        JobRequiredSkill added = new JobRequiredSkill();
                        added.setJob(job);
                        added.setSkill(skill);
                        job.getRequiredSkills().add(added);
                        return added;
                    });
            required.setMandatory(item.getMandatory());
            required.setWeight(item.getWeight());
        }
        job.getRequiredSkills().removeIf(item -> !ids.contains(item.getSkill().getSkillId()));
        invalidateScores(job);
    }

    @Transactional(readOnly = true)
    public ScoringConfigResponse getConfig(Long jobId, Long userId) {
        return config(owned(jobId, userId));
    }

    public ScoringConfigResponse updateConfig(Long jobId, ScoringConfigRequest request, Long userId) {
        Job job = ownedForUpdate(jobId, userId);
        Double[] weights = {request.getJaccardWeight(), request.getCosineWeight(), request.getEducationWeight()};
        double total = 0;
        for (Double weight : weights) {
            if (weight == null || !Double.isFinite(weight) || weight < 0 || weight > 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trọng số phải nằm trong [0, 1]");
            }
            total += weight;
        }
        if (Math.abs(total - 1) > 0.000001) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tổng ba trọng số phải bằng 1");
        }
        if (request.getMinPassScore() != null || request.getMinRequiredSkills() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ ba trọng số chấm điểm");
        }
        job.setW1(weights[0]);
        job.setW2(weights[1]);
        job.setW3(weights[2]);
        invalidateScores(job);
        return config(job);
    }

    private void invalidateScores(Job job) {
        job.getCvs().stream().map(CVs::getMatchResult).filter(java.util.Objects::nonNull)
                .forEach(result -> result.setAlgorithmVersion(null));
    }

    private ScoringConfigResponse config(Job job) {
        return ScoringConfigResponse.builder().jobId(job.getJobId()).jaccardWeight(job.getW1())
                .cosineWeight(job.getW2()).educationWeight(job.getW3()).build();
    }

    private List<JobSkillResponse> skillResponses(Job job) {
        return job.getRequiredSkills().stream().map(item -> JobSkillResponse.builder()
                .skillId(item.getSkill().getSkillId()).skillName(item.getSkill().getCanonicalName())
                .skillCategory(item.getSkill().getCategory() == null ? null : item.getSkill().getCategory().getName())
                .mandatory(item.isMandatory()).weight(item.getWeight() == null ? 1.0 : item.getWeight()).build()).toList();
    }

    private JobResponse response(Job job) {
        return JobResponse.builder().jobId(job.getJobId()).title(job.getTitle()).description(job.getDescription())
                .minExperienceYears(job.getMinExperienceYears()).educationRequirements(job.getEducationRequirements())
                .status(job.getStatus()).userId(job.getUser().getId()).createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt()).requiredSkills(skillResponses(job)).build();
    }
}
