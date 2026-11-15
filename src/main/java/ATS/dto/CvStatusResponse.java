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
public class CvStatusResponse {
    private Long cvId;
    private CVStatus status;
    private LocalDateTime updatedAt;
    private String errorMessage;
}
