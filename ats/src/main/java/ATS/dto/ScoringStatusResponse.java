package ATS.dto;

/** Tổng quan toàn JD, không phụ thuộc bộ lọc hay trang của bảng xếp hạng. */
public record ScoringStatusResponse(Long jobId, int totalCvs, int readyCvs, int currentCvs,
                                    int unscoredCvs, int staleCvs, int pendingCvs, int parsingCvs,
                                    int parseFailedCvs, int passedCvs, int hardFailedCvs,
                                    String algorithmVersion) {}
