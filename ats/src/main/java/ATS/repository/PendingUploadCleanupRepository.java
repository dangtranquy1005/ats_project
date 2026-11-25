package ATS.repository;

import ATS.entities.PendingUploadCleanup;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.*;

public interface PendingUploadCleanupRepository extends JpaRepository<PendingUploadCleanup, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PendingUploadCleanup p WHERE p.filePath = :path")
    Optional<PendingUploadCleanup> findLocked(@Param("path") String path);

    @Query("SELECT p.filePath FROM PendingUploadCleanup p WHERE p.eligibleAt < :now ORDER BY p.eligibleAt")
    List<String> findDue(@Param("now") LocalDateTime now, Pageable pageable);
}
