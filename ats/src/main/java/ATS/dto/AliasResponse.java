package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AliasResponse {
    private Long aliasId;
    private Long skillId;
    private String aliasText;
}
