package ATS.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tbl_audit_log")
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditLogId;
    
    @Column(nullable = false)
    private String action;
    
    @Column(nullable = false)
    private String entityType;
    
    @Column(nullable = false)
    private Long entityId;
    
    @Column(nullable = false)
    private String performedBy;
    
    @Column(columnDefinition = "TEXT")
    private String changes;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
    
    @Column(length = 45)
    private String ipAddress;
}
