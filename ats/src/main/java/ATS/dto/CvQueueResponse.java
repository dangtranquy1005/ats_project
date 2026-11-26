package ATS.dto;

import java.util.List;
import java.util.Map;

public record CvQueueResponse(List<CvQueueItem> items, int page, int size, long totalElements,
                              int totalPages, Map<String, Long> statusCounts) {}
