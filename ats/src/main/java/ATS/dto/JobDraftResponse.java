package ATS.dto;

import java.util.List;
public record JobDraftResponse(String title, String description, Integer minExperienceYears,
        String educationRequirements, List<Skill> requiredSkills, List<String> warnings,
        String experienceSource, String educationSource) {
    public record Skill(Long skillId, String skillName, Boolean mandatory, Double weight, String sourceText) {}
}
