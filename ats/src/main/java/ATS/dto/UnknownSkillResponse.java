package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnknownSkillResponse {
    private Long skillId;
    private String skillName;
    private Integer usageCount;
}
