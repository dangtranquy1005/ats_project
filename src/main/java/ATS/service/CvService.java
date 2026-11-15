package ATS.service;

import ATS.dto.*;
import ATS.enums.CVStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CvService {
    
    /**
     * Upload multiple CV files for a job
     * @param jobId Job ID
     * @param files List of CV files to upload
     * @param userId User ID
     * @return List of upload results
     */
    List<CvUploadResult> upload(Long jobId, List<MultipartFile> files, Long userId);
    
    /**
     * List CVs for a job with filter by status
     * @param jobId Job ID
     * @param userId User ID
     * @param status CV status filter
     * @param pageable Pagination info
     * @return Page of CV summaries
     */
    PageResponse<CvSummaryResponse> listCvs(Long jobId, Long userId, CVStatus status, Pageable pageable);
    
    /**
     * Get CV details including match result and parsed content
     * @param cvId CV ID
     * @param userId User ID
     * @return CV detail response
     */
    CvDetailResponse getCvDetail(Long cvId, Long userId);
    
    /**
     * Get current status of a CV
     * @param cvId CV ID
     * @param userId User ID
     * @return CV status response
     */
    CvStatusResponse getStatus(Long cvId, Long userId);
    
    /**
     * Get CV file for download
     * @param cvId CV ID
     * @param userId User ID
     * @return File resource
     */
    org.springframework.core.io.Resource getFile(Long cvId, Long userId);
    
    /**
     * Reprocess CV (re-parse and re-match)
     * @param cvId CV ID
     * @param userId User ID
     * @return Updated CV status
     */
    CvStatusResponse reprocess(Long cvId, Long userId);
    
    /**
     * Delete a CV
     * @param cvId CV ID
     * @param userId User ID
     */
    void deleteCv(Long cvId, Long userId);
}
