package ATS.repository;

import ATS.entities.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    interface ScoringTarget { Long getJobId(); Long getUserId(); }

    @Query("SELECT DISTINCT j.jobId AS jobId, j.user.id AS userId FROM CVs c JOIN c.job j "
            + "LEFT JOIN c.matchResult m WHERE j.jobId > :afterJobId AND j.status = ATS.enums.JobStatus.OPEN AND j.requiredSkills IS NOT EMPTY "
            + "AND c.status IN (ATS.enums.CVStatus.PARSED, ATS.enums.CVStatus.SCORED, ATS.enums.CVStatus.REVIEWED) "
            + "AND (c.matchResult IS NULL OR m.algorithmVersion IS NULL OR m.algorithmVersion <> :version "
            + "OR m.detailsJson IS NULL OR TRIM(m.detailsJson) = '') ORDER BY j.jobId")
    java.util.List<ScoringTarget> findJobsNeedingScoring(@Param("version") String version, @Param("afterJobId") Long afterJobId, Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.jobId = :jobId AND j.user.id = :userId")
    Optional<Job> findOwnedForUpdate(@Param("jobId") Long jobId, @Param("userId") Long userId);
    Optional<Job> findByJobIdAndUserId(Long jobId, Long userId);

    Page<Job> findByUserId(Long userId, Pageable pageable);

    Job save(Job job);

    void delete(Job job);
}
