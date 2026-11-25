package ATS.dto;

import ATS.enums.CVStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvUploadResult {
    private Long cvId;
    private String candidateName;
    private String email;
    private CVStatus status;
    private String filePath;
    private Boolean success;
    private String errorMessage;
    private String filename;
}
