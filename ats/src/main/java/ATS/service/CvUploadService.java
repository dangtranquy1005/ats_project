package ATS.service;

import ATS.dto.CvUploadResult;
import ATS.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Nhận file trên luồng HTTP, commit từng CV rồi giao việc đọc PDF cho worker. */
@Slf4j
@Service
@RequiredArgsConstructor
public class CvUploadService {
    private final FileStorageService storage;
    private final JobRepository jobs;
    private final CvUploadTransactions transactions;
    private final UploadCleanupWorker cleanup;
    private final CvPdfWorker pdfWorker;

    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private DataSize maxFileSize = DataSize.ofMegabytes(10);

    public List<CvUploadResult> uploadCvs(Long jobId, List<MultipartFile> files, Long userId) {
        var job = jobs.findByJobIdAndUserId(jobId, userId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy công việc"));
        if (job.getStatus() != ATS.enums.JobStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "JD đã đóng, không thể nhận thêm CV");
        }
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần chọn ít nhất một file PDF");
        }
        List<CvUploadResult> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(uploadSingle(file, jobId, userId));
        }
        return results;
    }

    private CvUploadResult uploadSingle(MultipartFile file, Long jobId, Long userId) {
        String filename = file == null ? null : file.getOriginalFilename();
        if (file == null || file.isEmpty() || filename == null || filename.length() > 255
                || !filename.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            return failure(filename, "Cần file PDF có nội dung và tên hợp lệ");
        }
        if (file.getSize() > maxFileSize.toBytes()) {
            return failure(filename, "File vượt quá dung lượng cho phép");
        }
        String path = storage.newFilePath(userId, jobId);
        CvUploadResult saved;
        try {
            // Ticket được commit trước thao tác MinIO. Worker dọn được cả upload bị gián đoạn.
            transactions.reserve(path);
            storage.uploadFile(file, path);
            // Lời gọi qua bean riêng kết thúc transaction trước khi báo success.
            saved = transactions.register(jobId, userId, path, filename);
        } catch (Exception error) {
            log.error("Upload failed for {}", filename, error);
            cleanup.delete(path, true);
            return failure(filename, "Không lưu được hồ sơ. Có thể thử tải lại file này");
        }
        // Nếu hàng đợi bận, bản ghi PENDING vẫn được poller lấy lại.
        pdfWorker.submit(saved.getCvId());
        return saved;
    }

    private CvUploadResult failure(String filename, String message) {
        return CvUploadResult.builder().filename(filename).success(false).errorMessage(message).build();
    }
}
