package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RescoreResult {
    private Long jobId;
    private Integer totalCvs;
    private Integer updatedCvs;
    private Integer failedCvs;
    private String message;
}
