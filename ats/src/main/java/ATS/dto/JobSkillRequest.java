package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkillRequest {
    private Long skillId;
    @Builder.Default
    private Boolean mandatory = true;
    @Builder.Default
    private Double weight = 1.0;
}
