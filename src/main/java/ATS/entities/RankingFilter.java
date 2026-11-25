package ATS.entities;

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
    private String sortBy;
    private String sortOrder;
    private Integer pageSize;
    private Integer pageNumber;
}
