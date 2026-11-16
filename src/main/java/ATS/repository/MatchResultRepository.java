package ATS.repository;

import ATS.dto.RankingItem;
import ATS.entities.MatchResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {

    /**
     * Find ranking items for a job with optional score filters.
     * Note: rank is NOT included in JPQL - calculate in service layer.
     * ROW_NUMBER() OVER() is not supported in JPQL constructor expressions.
     */
    @Query("SELECT new ATS.dto.RankingItem(" +
            "m.cv.cvId, " +
            "m.cv.job.jobId, " +
            "m.overallScore, " +
            "m.jaccardScore, " +
            "m.cosineScore, " +
            "m.educationScore, " +
            "m.cv.candidateName, " +
            "m.cv.email) " +
            "FROM MatchResult m " +
            "WHERE m.cv.job.jobId = :jobId " +
            "AND (:minScore IS NULL OR m.overallScore >= :minScore) " +
            "AND (:maxScore IS NULL OR m.overallScore <= :maxScore) " +
            "ORDER BY m.overallScore DESC")
    Page<RankingItem> findRanking(
            @Param("jobId") Long jobId,
            @Param("minScore") Double minScore,
            @Param("maxScore") Double maxScore,
            Pageable pageable);

    /**
     * Get match detail for a specific CV belonging to a user
     */
    @Query("SELECT m FROM MatchResult m " +
            "WHERE m.cv.cvId = :cvId AND m.cv.job.user.id = :userId")
    Optional<MatchResult> findDetail(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    /**
     * Find all match results for a job
     */
    @Query("SELECT m FROM MatchResult m WHERE m.cv.job.jobId = :jobId")
    List<MatchResult> findAllByJob(@Param("jobId") Long jobId);

    /**
     * Find all match results for a job ordered by score descending
     */
    @Query("SELECT m FROM MatchResult m " +
            "WHERE m.cv.job.jobId = :jobId " +
            "ORDER BY m.overallScore DESC")
    List<MatchResult> findAllRanked(@Param("jobId") Long jobId);
}
