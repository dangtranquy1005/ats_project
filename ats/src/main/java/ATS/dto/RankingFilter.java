package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingFilter {
    private Double minScore;
    private Double maxScore;
    private String sortBy;      // OVERALL_SCORE, SKILL (legacy JACCARD), COSINE, EDUCATION
    private String sortOrder;   // ASC, DESC
    private String query;       // Tìm trên tên, email, ID CV trước khi phân trang
    private Boolean passedHardFilter;
    private ATS.enums.HrReviewStatus reviewStatus;
}
