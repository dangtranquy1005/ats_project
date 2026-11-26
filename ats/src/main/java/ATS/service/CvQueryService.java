package ATS.service;

import ATS.dto.*;
import ATS.entities.CVs;
import ATS.enums.CVStatus;
import ATS.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CvQueryService {
    private final CVRepository cvs;
    private final JobRepository jobs;

    public CvQueueResponse list(Long jobId, Long userId, CVStatus status, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0, size trong [1, 100]");
        }
        jobs.findByJobIdAndUserId(jobId, userId).orElseThrow(this::notFound);
        var result = cvs.findQueue(jobId, userId, status, PageRequest.of(page, size));
        Map<String, Long> counts = new LinkedHashMap<>();
        for (CVStatus value : CVStatus.values()) counts.put(value.name(), 0L);
        cvs.countQueue(jobId, userId).forEach(count -> counts.put(count.getStatus().name(), count.getTotal()));
        return new CvQueueResponse(result.map(this::item).getContent(), page, size,
                result.getTotalElements(), result.getTotalPages(), counts);
    }

    public CvExtractionDetail detail(Long id, Long userId) {
        CVs cv = cvs.findOwned(id, userId).orElseThrow(this::notFound);
        return new CvExtractionDetail(item(cv), cv.getPhone(),
                cv.getCvSkills().stream().map(s -> new CvExtractionDetail.Skill(s.getSkill().getSkillId(),
                        s.getSkill().getCanonicalName(), s.getMatchMethod())).toList(),
                cv.getExperiences().stream().map(e -> new CvExtractionDetail.Experience(e.getCompanyName(),
                        e.getJobTitle(), e.getStartDate(), e.getEndDate(), e.getStartDatePrecision(),
                        e.getEndDatePrecision(), e.getCurrent(), e.getDescription(), e.getSourceText())).toList(),
                cv.getEducations().stream().map(e -> new CvExtractionDetail.Education(e.getInstitution(),
                        e.getDegree(), e.getFieldOfStudy(), e.getGraduationYear(), e.getSourceText())).toList());
    }

    public record StoredFile(String path, String filename) {}
    public StoredFile file(Long id, Long userId) {
        CVs cv = cvs.findOwned(id, userId).orElseThrow(this::notFound);
        return new StoredFile(cv.getFilePath(), filename(cv));
    }

    private CvQueueItem item(CVs cv) {
        return new CvQueueItem(cv.getCvId(), cv.getJob().getJobId(), filename(cv), cv.getCandidateName(),
                cv.getEmail(), cv.getStatus(), cv.getUploadedAt(), cv.getUpdatedAt(), cv.getErrorMessage(),
                cv.getRawText() != null && !cv.getRawText().isBlank(), cv.getHrReviewStatus());
    }

    private String filename(CVs cv) {
        // Không trả khóa MinIO nội bộ khi CV cũ chưa lưu tên file.
        return cv.getOriginalFilename() == null || cv.getOriginalFilename().isBlank()
                ? "CV-" + cv.getCvId() + ".pdf" : cv.getOriginalFilename();
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu thuộc người dùng");
    }
}
