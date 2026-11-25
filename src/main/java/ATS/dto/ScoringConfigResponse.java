package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringConfigResponse {
    private Long jobId;
    private Double jaccardWeight;
    private Double cosineWeight;
    private Double educationWeight;
    private Double minPassScore;
    private Integer minRequiredSkills;
}
