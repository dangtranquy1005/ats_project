package ATS.repository;

import ATS.entities.CVs;
import ATS.enums.CVStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CVRepository extends JpaRepository<CVs, Long> {
    
    CVs save(CVs cv);

    @Query("SELECT c FROM CVs c WHERE c.job.jobId = :jobId AND c.job.user.id = :userId AND c.status = :status")
    Page<CVs> findByJobIdAndUserIdAndStatus(
            @Param("jobId") Long jobId,
            @Param("userId") Long userId,
            @Param("status") CVStatus status,
            Pageable pageable);

    @Query("SELECT c FROM CVs c WHERE c.cvId = :cvId AND c.job.user.id = :userId")
    Optional<CVs> findDetailById(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    @Query("SELECT c.status FROM CVs c WHERE c.cvId = :cvId AND c.job.user.id = :userId")
    Optional<CVStatus> findStatus(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    @Query("SELECT c.filePath FROM CVs c WHERE c.cvId = :cvId AND c.job.user.id = :userId")
    Optional<String> findFilePath(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    @Query("SELECT c FROM CVs c WHERE c.cvId = :cvId AND c.job.user.id = :userId")
    Optional<CVs> findOwned(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    void delete(CVs cv);

    @Modifying
    @Transactional
    @Query("UPDATE CVs c SET c.status = :to WHERE c.cvId = :id AND c.status = :from")
    int transition(
            @Param("id") Long id,
            @Param("from") CVStatus from,
            @Param("to") CVStatus to);

    @Modifying
    @Transactional
    @Query("UPDATE CVs c SET c.status = :to WHERE c.status = :from")
    int resetState(
            @Param("from") CVStatus from,
            @Param("to") CVStatus to);

    @Query("SELECT c.cvId FROM CVs c WHERE c.status = :status AND c.uploadedAt < :before")
    List<Long> findIdsByStatusBefore(
            @Param("status") CVStatus status,
            @Param("before") Instant before);
}
