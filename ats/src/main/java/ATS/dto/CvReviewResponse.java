package ATS.dto;

import ATS.enums.HrReviewStatus;
import java.time.LocalDateTime;

public record CvReviewResponse(Long cvId, Long jobId, HrReviewStatus reviewStatus, String note,
                                LocalDateTime reviewedAt, long version, boolean canReview, boolean canEdit) {}
