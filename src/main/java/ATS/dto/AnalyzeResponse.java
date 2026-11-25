package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyzeResponse {
    private Long cvId;
    private String candidateName;
    private String email;
    private String phone;
    private String rawNlpResult;
    private List<Object> skills;
    private List<Object> experiences;
    private List<Object> educations;
}
