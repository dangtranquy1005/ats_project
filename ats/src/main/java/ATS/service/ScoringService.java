package ATS.service;

import ATS.dto.*;
import org.springframework.data.domain.Pageable;

public interface ScoringService {
    
    /**
     * Get ranked CVs for a job with optional filtering
     * @param jobId Job ID
     * @param userId User ID
     * @param filter Ranking filter with score range and sorting
     * @param pageable Pagination info
     * @return Page of ranking items
     */
    PageResponse<RankingItem> getRanking(Long jobId, Long userId, RankingFilter filter, Pageable pageable);
    
    /**
     * Get detailed match information for a CV
     * @param cvId CV ID
     * @param userId User ID
     * @return Match detail response with skill matching info
     */
    MatchDetailResponse getMatchDetail(Long cvId, Long userId);
    
    /**
     * Update scoring configuration for a job
     * @param jobId Job ID
     * @param config Scoring configuration
     * @param userId User ID
     * @return Updated scoring configuration
     */
    ScoringConfigResponse updateConfig(Long jobId, ScoringConfigRequest config, Long userId);
    
    /**
     * Rescore all CVs for a job with new configuration
     * @param jobId Job ID
     * @param userId User ID
     * @return Rescore result with statistics
     */
    RescoreResult rescore(Long jobId, Long userId);
}
