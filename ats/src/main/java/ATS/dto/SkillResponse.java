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
public class SkillResponse {
    private Long skillId;
    private String canonicalName;
    private String description;
    private SkillType skillType;
    private Long categoryId;
    private String categoryName;
    private java.util.List<AliasResponse> aliases;
    private boolean inUse;
}
