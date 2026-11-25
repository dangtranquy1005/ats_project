package ATS.service;

import ATS.dto.*;
import ATS.entities.*;
import ATS.enums.CVStatus;
import ATS.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Mỗi lời gọi ghi DB commit độc lập trước khi trả về cho service điều phối.
 * Các thao tác đọc/ghi MinIO chạy bên ngoài lớp này.
 */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.REQUIRES_NEW)
public class CvUploadTransactions {
    private final CVRepository cvs;
    private final JobRepository jobs;
    private final PendingUploadCleanupRepository pending;

    public void reserve(String path) {
        PendingUploadCleanup ticket = new PendingUploadCleanup();
        ticket.setFilePath(path);
        // Lớn hơn thời hạn tối đa của một lời gọi MinIO (120 giây).
        ticket.setEligibleAt(LocalDateTime.now().plusMinutes(10));
        pending.save(ticket);
    }

    public CvUploadResult register(Long jobId, Long userId, String path, String filename) {
        PendingUploadCleanup ticket = pending.findLocked(path).orElseThrow(() ->
                new IllegalStateException("Phiên upload đã hết hạn, vui lòng thử lại"));
        if (ticket.getCleanupToken() != null || ticket.getEligibleAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Phiên upload đã hết hạn, vui lòng thử lại");
        }
        Job job = jobs.findOwnedForUpdate(jobId, userId).orElseThrow(this::notFound);
        CVs cv = new CVs();
        cv.setJob(job);
        cv.setFilePath(path);
        cv.setOriginalFilename(filename);
        cv.setStatus(CVStatus.PENDING);
        cvs.saveAndFlush(cv);
        // Ticket và CV được thay đổi cùng transaction. Lỗi commit vẫn giữ ticket để xóa bù.
        pending.delete(ticket);
        return CvUploadResult.builder().cvId(cv.getCvId()).filename(filename).filePath(path)
                .status(CVStatus.PENDING).success(true).build();
    }

    public record PdfTask(Long id, String path, String token) {}

    public Optional<PdfTask> claim(Long id) {
        Optional<CVs> found = cvs.findLocked(id);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        CVs cv = found.get();
        if (cv.getStatus() != CVStatus.PENDING || hasText(cv)) {
            return Optional.empty();
        }
        String token = UUID.randomUUID().toString();
        cv.setStatus(CVStatus.PARSING);
        cv.setPdfProcessingToken(token);
        cv.setPdfProcessingStartedAt(LocalDateTime.now());
        cv.setUpdatedAt(LocalDateTime.now());
        return Optional.of(new PdfTask(id, cv.getFilePath(), token));
    }

    public void finishPdf(PdfTask task, String text) {
        cvs.findLocked(task.id()).filter(cv -> ownsTask(cv, task)).ifPresent(cv -> {
            cv.setRawText(text);
            // PENDING với rawText có nghĩa là đã đọc PDF và đang chờ bước NLP.
            cv.setStatus(CVStatus.PENDING);
            cv.setErrorMessage(null);
            finishTask(cv);
        });
    }

    public void failPdf(PdfTask task, String reason) {
        cvs.findLocked(task.id()).filter(cv -> ownsTask(cv, task)).ifPresent(cv -> {
            cv.setStatus(CVStatus.PARSED_FAILED);
            cv.setErrorMessage(reason.length() > 250 ? reason.substring(0, 250) : reason);
            finishTask(cv);
        });
    }

    private boolean ownsTask(CVs cv, PdfTask task) {
        return cv.getStatus() == CVStatus.PARSING && Objects.equals(task.token(), cv.getPdfProcessingToken());
    }

    private void finishTask(CVs cv) {
        cv.setPdfProcessingToken(null);
        cv.setPdfProcessingStartedAt(null);
        cv.setUpdatedAt(LocalDateTime.now());
    }

    public void recover(Long id, LocalDateTime before) {
        cvs.findLocked(id).filter(cv -> cv.getStatus() == CVStatus.PARSING
                && cv.getPdfProcessingStartedAt() != null && cv.getPdfProcessingStartedAt().isBefore(before)
                && cv.getPdfProcessingToken() != null).ifPresent(cv -> {
                    cv.setStatus(CVStatus.PENDING);
                    finishTask(cv);
                });
    }

    public CvStatusResponse retry(Long id, Long userId) {
        CVs cv = cvs.findLocked(id).orElseThrow(this::notFound);
        if (cv.getJob().getUser().getId() != userId.longValue()) {
            throw notFound();
        }
        if (cv.getStatus() != CVStatus.PARSED_FAILED || hasText(cv)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ chạy lại bước PDF đã thất bại");
        }
        cv.setStatus(CVStatus.PENDING);
        cv.setErrorMessage(null);
        finishTask(cv);
        return status(cv);
    }

    @Transactional(readOnly = true)
    public CvStatusResponse getStatus(Long id, Long userId) {
        return status(cvs.findOwned(id, userId).orElseThrow(this::notFound));
    }

    private CvStatusResponse status(CVs cv) {
        return CvStatusResponse.builder().cvId(cv.getCvId()).status(cv.getStatus())
                .updatedAt(cv.getUpdatedAt()).errorMessage(cv.getErrorMessage()).textExtracted(hasText(cv)).build();
    }

    private boolean hasText(CVs cv) {
        return cv.getRawText() != null && !cv.getRawText().isBlank();
    }

    /** Claim tách biệt để việc xóa MinIO không giữ transaction hoặc khóa DB. */
    public Optional<String> claimCleanup(String path, boolean immediate) {
        Optional<PendingUploadCleanup> found = pending.findLocked(path);
        if (found.isEmpty()) {
            // Ticket đã bị xóa cùng CV commit thành công, tránh xóa file của CV đó.
            return Optional.empty();
        }
        PendingUploadCleanup ticket = found.get();
        if (!immediate && ticket.getEligibleAt().isAfter(LocalDateTime.now())) {
            return Optional.empty();
        }
        String token = UUID.randomUUID().toString();
        ticket.setCleanupToken(token);
        ticket.setEligibleAt(LocalDateTime.now().plusMinutes(10));
        return Optional.of(token);
    }

    public void finishCleanup(String path, String token, boolean success) {
        pending.findLocked(path).filter(ticket -> token.equals(ticket.getCleanupToken())).ifPresent(ticket -> {
            if (success) {
                pending.delete(ticket);
            } else {
                ticket.setEligibleAt(LocalDateTime.now().plusSeconds(30));
            }
        });
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thuộc người dùng");
    }
}
