package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkillResponse {
    private Long skillId;
    private String skillName;
    private String skillCategory;
    private boolean mandatory;
    private Double weight;
}
