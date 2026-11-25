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
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.jobId = :jobId AND j.user.id = :userId")
    Optional<Job> findOwnedForUpdate(@Param("jobId") Long jobId, @Param("userId") Long userId);
    Optional<Job> findByJobIdAndUserId(Long jobId, Long userId);

    Page<Job> findByUserId(Long userId, Pageable pageable);

    Job save(Job job);

    void delete(Job job);
}
