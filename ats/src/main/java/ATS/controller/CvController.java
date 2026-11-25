package ATS.controller;

import ATS.dto.CvUploadResult;
import ATS.dto.CvStatusResponse;
import ATS.entities.User;
import ATS.service.CvUploadService;
import ATS.service.PdfTextExtractor;
import ATS.service.UserService;
import ATS.service.CvUploadTransactions;
import ATS.service.CvPdfWorker;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cvs")
@RequiredArgsConstructor
@Tag(name = "CV Management", description = "Upload and manage CVs")
public class CvController {
    private static final Path TEST_OUTPUT_DIRECTORY = Path.of("target", "cv-extraction");
    
    private final CvUploadService cvUploadService;
    private final PdfTextExtractor pdfTextExtractor;
    private final UserService userService;
    private final CvUploadTransactions transactions;
    private final CvPdfWorker pdfWorker;

    private Long currentUserId(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User user = userService.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getId();
    }
    
    /**
     * Upload multiple CV files for a job
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CVs", description = "Upload multiple PDF CV files for a job")
    public ResponseEntity<List<CvUploadResult>> uploadCvs(
            @RequestParam("jobId") Long jobId,
            @RequestParam("files") List<MultipartFile> files,
            Authentication authentication) {
        
        return ResponseEntity.accepted().body(cvUploadService.uploadCvs(jobId, files, currentUserId(authentication)));
    }

    @GetMapping("/{id}/status")
    public CvStatusResponse status(@PathVariable Long id, Authentication authentication) {
        return transactions.getStatus(id, currentUserId(authentication));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<CvStatusResponse> retry(@PathVariable Long id, Authentication authentication) {
        CvStatusResponse status = transactions.retry(id, currentUserId(authentication));
        pdfWorker.submit(id);
        return ResponseEntity.accepted().body(status);
    }

    @PostMapping(value = "/extract-test", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Thử trích văn bản CV từ một file PDF")
    public ResponseEntity<String> extractTest(@RequestPart("file") MultipartFile file) {
        String text;
        try {
            text = pdfTextExtractor.extractText(file);
        } catch (PdfTextExtractor.PdfExtractionException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, e.getMessage(), e);
        }
        if (text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "PDF không có đủ văn bản đọc được");
        }

        String filename = "cv-" + UUID.randomUUID() + ".txt";
        try {
            Files.createDirectories(TEST_OUTPUT_DIRECTORY);
            Files.writeString(TEST_OUTPUT_DIRECTORY.resolve(filename), text, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không lưu được file văn bản trích xuất", e);
        }
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(text);
    }
}
