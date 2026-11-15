package ATS.dto;

import ATS.enums.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {
    private Long jobId;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private Double salary;
    private JobStatus status;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<JobSkillResponse> requiredSkills;
}
