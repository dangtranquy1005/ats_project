package ATS.repository;

import ATS.entities.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    Optional<Job> findByJobIdAndUserId(Long jobId, Long userId);

    Page<Job> findByUserId(Long userId, Pageable pageable);

    Job save(Job job);

    void delete(Job job);
}
