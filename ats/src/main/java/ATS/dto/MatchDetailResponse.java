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
    private List<String> missingMandatorySkills;
    private List<String> hardFilterReasons;
    private java.time.LocalDateTime calculatedAt;
    private String algorithmVersion;
    private Weights weights;
    private List<SkillBreakdown> skillBreakdown;
    private Double experienceYears;
    private Integer requiredExperienceYears;
    private String educationRequirements;

    public record Weights(double skill, double cosine, double education) {}
    public record SkillBreakdown(Long skillId, String skillName, boolean mandatory, double weight, boolean matched) {}

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    public Double getSkillScore() {
        return jaccardScore;
    }
}
