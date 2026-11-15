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
    private String sortBy;      // OVERALL_SCORE, JACCARD, COSINE, EDUCATION
    private String sortOrder;   // ASC, DESC
}
