package ATS.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogFilter {
    private String action;
    private String entityType;
    private String performedBy;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
