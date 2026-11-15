package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchDetailResponse {
    private Long cvId;
    private Long jobId;
    private String candidateName;
    private Double overallScore;
    private Double jaccardScore;
    private Double cosineScore;
    private Double educationScore;
    private Boolean passedHardFilter;
    
    // Matching details
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private Integer matchedSkillCount;
    private Integer totalRequiredSkills;
}
