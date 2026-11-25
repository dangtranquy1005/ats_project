package ATS.dto;

import ATS.enums.CVStatus;
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
public class CvDetailResponse {
    private Long cvId;
    private String candidateName;
    private String email;
    private String phone;
    private CVStatus status;
    private String filePath;
    private String rawText;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
    
    // Match Result
    private Double jaccardScore;
    private Double cosineScore;
    private Double educationScore;
    private Double overallScore;
    private Boolean passedHardFilter;
    
    // Education & Experience
    private List<Object> educations;
    private List<Object> experiences;
    private List<Object> skills;
}
