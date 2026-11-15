package ATS.dto;

import ATS.enums.SkillType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillRequest {
    private String canonicalName;
    private String description;
    private SkillType skillType;
    private Long categoryId;
}
