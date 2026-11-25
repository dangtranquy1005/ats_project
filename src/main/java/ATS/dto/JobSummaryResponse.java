package ATS.dto;

import ATS.enums.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSummaryResponse {
    private Long jobId;
    private String title;
    private String location;
    private Double salary;
    private JobStatus status;
    private LocalDateTime createdAt;
    private Integer totalApplications;
}
