package ATS.dto;

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
    private String candidateName;
    private String email;
    private Double overallScore;
    private Double jaccardScore;
    private Double cosineScore;
    private Double educationScore;
    private Integer rank;
}
