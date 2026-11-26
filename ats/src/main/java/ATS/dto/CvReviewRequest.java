package ATS.dto;

import ATS.enums.HrReviewStatus;

public record CvReviewRequest(HrReviewStatus reviewStatus, String note, Long expectedVersion) {}
