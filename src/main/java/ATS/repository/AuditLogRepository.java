package ATS.repository;

import ATS.entities.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    AuditLog save(AuditLog log);

    @Query("SELECT a FROM AuditLog a " +
            "WHERE (:action IS NULL OR a.action = :action) " +
            "AND (:entityType IS NULL OR a.entityType = :entityType) " +
            "AND (:performedBy IS NULL OR a.performedBy = :performedBy) " +
            "AND (:startDate IS NULL OR a.timestamp >= :startDate) " +
            "AND (:endDate IS NULL OR a.timestamp <= :endDate) " +
            "ORDER BY a.timestamp DESC")
    Page<AuditLog> findAll(
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("performedBy") String performedBy,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
