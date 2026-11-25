package ATS.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingItem {
    private Long cvId;
    private Long jobId;
    private Double overallScore;
    private Double jaccardScore;
    private Double cosineScore;
    private Double educationScore;
    private String candidateName;
    private String email;
    private Integer rank;
}
