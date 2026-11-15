package ATS.repository;

import ATS.entities.MatchResult;
import ATS.entities.RankingItem;
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
    
    @Query("SELECT new ATS.entities.RankingItem(" +
            "m.cv.cvId, " +
            "m.cv.job.id, " +
            "m.overallScore, " +
            "m.jaccardScore, " +
            "m.cosineScore, " +
            "m.educationScore, " +
            "m.cv.candidateName, " +
            "m.cv.email, " +
            "ROW_NUMBER() OVER (ORDER BY m.overallScore DESC) as rank) " +
            "FROM MatchResult m " +
            "WHERE m.cv.job.id = :jobId " +
            "AND (:minScore IS NULL OR m.overallScore >= :minScore) " +
            "AND (:maxScore IS NULL OR m.overallScore <= :maxScore)")
    Page<RankingItem> findRanking(
            @Param("jobId") Long jobId,
            @Param("minScore") Double minScore,
            @Param("maxScore") Double maxScore,
            Pageable pageable);

    @Query("SELECT m FROM MatchResult m " +
            "WHERE m.cv.cvId = :cvId AND m.cv.job.user.id = :userId")
    Optional<MatchResult> findDetail(
            @Param("cvId") Long cvId,
            @Param("userId") Long userId);

    @Query("SELECT m FROM MatchResult m WHERE m.cv.job.id = :jobId")
    List<MatchResult> findAllByJob(@Param("jobId") Long jobId);

    @Query("SELECT m FROM MatchResult m " +
            "WHERE m.cv.job.id = :jobId " +
            "ORDER BY m.overallScore DESC")
    List<MatchResult> findAllRanked(@Param("jobId") Long jobId);

    List<MatchResult> saveAll(List<MatchResult> results);
}
