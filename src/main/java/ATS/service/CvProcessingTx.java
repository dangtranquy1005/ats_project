package ATS.service;

import ATS.dto.AnalyzeRequest;
import ATS.dto.AnalyzeResponse;

import java.time.Instant;
import java.util.List;

public interface CvProcessingTx {
    
    /**
     * Claim a CV for processing (lock mechanism)
     * @param cvId CV ID to claim
     * @return true if successfully claimed, false if already claimed
     */
    boolean claim(Long cvId);
    
    /**
     * Prepare CV for NLP analysis
     * @param cvId CV ID
     * @return Analyze request with extracted text
     */
    AnalyzeRequest prepareRequest(Long cvId);
    
    /**
     * Save analysis result to database
     * @param cvId CV ID
     * @param response Analysis response from NLP service
     */
    void saveResult(Long cvId, AnalyzeResponse response);
    
    /**
     * Mark CV as failed during processing
     * @param cvId CV ID
     * @param reason Failure reason
     */
    void markFailed(Long cvId, String reason);
    
    /**
     * Reset processing state for CVs that are stuck
     * @param before Reset CVs with status before this timestamp
     * @return Number of CVs reset
     */
    int resetStaleProcessing(Instant before);
    
    /**
     * Find CV IDs pending processing
     * @param before Find CVs with pending status before this timestamp
     * @return List of CV IDs
     */
    List<Long> findStalePendingIds(Instant before);
}
