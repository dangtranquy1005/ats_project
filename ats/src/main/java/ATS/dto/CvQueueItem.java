package ATS.dto;

import ATS.enums.CVStatus;
import java.time.LocalDateTime;

public record CvQueueItem(Long cvId, Long jobId, String filename, String candidateName, String email,
                          CVStatus status, LocalDateTime uploadedAt, LocalDateTime updatedAt,
                          String errorMessage, boolean textExtracted, ATS.enums.HrReviewStatus reviewStatus) {}
