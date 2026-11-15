package ATS.dto;

import ATS.enums.CVStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvSummaryResponse {
    private Long cvId;
    private String candidateName;
    private String email;
    private String phone;
    private CVStatus status;
    private LocalDateTime uploadedAt;
    private Double overallScore;
}
