package ATS.service;

import ATS.dto.*;
import ATS.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface JobService {
    

    JobResponse createJob(JobRequest request, Long currentUserId);

    Page<JobSummaryResponse> listJobsByUserId(Long userId, Pageable pageable);

    JobDetailResponse getJob(Long jobId, Long userId);

    JobResponse updateJob(Long jobId, JobRequest request, Long userId);

    JobResponse changeStatus(Long jobId, JobStatus status, Long userId);

    void deleteJob(Long jobId, Long userId);
    List<JobSkillResponse> getRequiredSkills(Long jobId, Long userId);
    JobResponse replaceRequiredSkills(Long jobId, List<JobSkillRequest> items, Long userId);
}
