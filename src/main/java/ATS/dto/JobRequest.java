package ATS.dto;

import ATS.enums.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobRequest {
    private String title;
    private String description;
    private String requirements;
    private List<Long> requiredSkillIds;
    private String location;
    private Double salary;
}
