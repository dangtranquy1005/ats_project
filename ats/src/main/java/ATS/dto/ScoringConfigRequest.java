package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringConfigRequest {
    @com.fasterxml.jackson.annotation.JsonAlias("skillWeight")
    private Double jaccardWeight;
    private Double cosineWeight;
    private Double educationWeight;
    private Double minPassScore;
    private Integer minRequiredSkills;
}
