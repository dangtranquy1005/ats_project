package ATS.service;

import ATS.dto.CvUploadResult;
import ATS.entities.CVs;
import ATS.entities.Job;
import ATS.enums.CVStatus;
import ATS.repository.CVRepository;
import ATS.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CvUploadService {
    
    private final PdfTextExtractor pdfTextExtractor;
    private final FileStorageService fileStorageService;
    private final CVRepository cvRepository;
    private final JobRepository jobRepository;
    
    /**
     * Upload multiple CV files
     * 
     * @param jobId Job ID to associate CVs with
     * @param files List of PDF files
     * @param userId User ID
     * @return List of upload results
     */
    @Transactional
    public List<CvUploadResult> uploadCvs(Long jobId, List<MultipartFile> files, Long userId) {
        // Verify job exists and belongs to user
        Job job = jobRepository.findByJobIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công việc"));
        
        List<CvUploadResult> results = new ArrayList<>();
        
        for (MultipartFile file : files) {
            CvUploadResult result = uploadSingleCv(file, job, userId);
            results.add(result);
        }
        
        return results;
    }
    
    /**
     * Upload single CV file
     */
    private CvUploadResult uploadSingleCv(MultipartFile file, Job job, Long userId) {
        try {
            // 1. Extract text from PDF
            String rawText = pdfTextExtractor.extractText(file);
            
            if (rawText.isEmpty()) {
                return CvUploadResult.builder()
                        .success(false)
                        .errorMessage("Không thể extract text từ PDF hoặc text quá ngắn")
                        .build();
            }
            
            // Extract basic information before uploading the PDF.
            String candidateName = extractCandidateName(rawText);
            String email = extractEmail(rawText);
            String phone = extractPhone(rawText);
            if (email == null) {
                return CvUploadResult.builder()
                        .success(false)
                        .errorMessage("Không tìm thấy email ứng viên trong văn bản CV")
                        .build();
            }

            String filePath = fileStorageService.uploadFile(file, userId, job.getJobId());
            
            // 4. Save CV entity to database
            CVs cv = new CVs();
            cv.setJob(job);
            cv.setCandidateName(candidateName);
            cv.setEmail(email);
            cv.setPhone(phone);
            cv.setFilePath(filePath);
            cv.setRawText(rawText);
            cv.setStatus(CVStatus.PENDING);  // Ready for NLP processing
            cv.setUploadedAt(LocalDateTime.now());
            
            CVs savedCv = cvRepository.save(cv);
            
            log.info("CV uploaded successfully: cvId={}, jobId={}, file={}",
                    savedCv.getCvId(), job.getJobId(), file.getOriginalFilename());
            
            return CvUploadResult.builder()
                    .cvId(savedCv.getCvId())
                    .candidateName(candidateName)
                    .email(email)
                    .status(CVStatus.PENDING)
                    .filePath(filePath)
                    .success(true)
                    .build();
            
        } catch (PdfTextExtractor.PdfExtractionException e) {
            log.error("PDF extraction failed for file: {}", file.getOriginalFilename(), e);
            return CvUploadResult.builder()
                    .success(false)
                    .errorMessage("Lỗi extract PDF: " + e.getMessage())
                    .build();
                    
        } catch (FileStorageService.FileStorageException e) {
            log.error("File storage failed for file: {}", file.getOriginalFilename(), e);
            return CvUploadResult.builder()
                    .success(false)
                    .errorMessage("Lỗi lưu file: " + e.getMessage())
                    .build();
                    
        } catch (Exception e) {
            log.error("Unexpected error uploading CV: {}", file.getOriginalFilename(), e);
            return CvUploadResult.builder()
                    .success(false)
                    .errorMessage("Lỗi không xác định: " + e.getMessage())
                    .build();
        }
    }
    
    /**
     * Simple name extraction (can be improved with NLP)
     */
    private String extractCandidateName(String text) {
        // Simple heuristic: first line or first few words
        String[] lines = text.split("\\n");
        if (lines.length > 0) {
            String firstLine = lines[0].trim();
            if (firstLine.length() > 3 && firstLine.length() < 100) {
                return firstLine;
            }
        }
        return "Unknown";
    }
    
    /**
     * Extract email from text
     */
    private String extractEmail(String text) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }
    
    /**
     * Extract phone from text
     */
    private String extractPhone(String text) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "\\+?[0-9]{1,4}?[-.\\s]?\\(?[0-9]{1,4}?\\)?[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,9}");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }
}
