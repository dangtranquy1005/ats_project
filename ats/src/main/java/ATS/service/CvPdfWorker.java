package ATS.service;

import ATS.repository.CVRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.time.LocalDateTime;

@Slf4j
@Service
public class CvPdfWorker {
    private final TaskExecutor executor;
    private final CvUploadTransactions transactions;
    private final FileStorageService storage;
    private final PdfTextExtractor extractor;
    private final CVRepository cvs;
    private final CvNlpWorker nlp;

    public CvPdfWorker(@Qualifier("cvPdfExecutor") TaskExecutor executor, CvUploadTransactions transactions,
                       FileStorageService storage, PdfTextExtractor extractor, CVRepository cvs, CvNlpWorker nlp) {
        this.executor = executor;
        this.transactions = transactions;
        this.storage = storage;
        this.extractor = extractor;
        this.cvs = cvs;
        this.nlp = nlp;
    }

    public void submit(Long cvId) {
        try {
            executor.execute(() -> process(cvId));
        } catch (TaskRejectedException error) {
            // CV đã commit ở PENDING. Poller sẽ lấy lại khi hàng đợi có chỗ.
            log.info("PDF executor busy; cvId={} remains pending", cvId);
        }
    }

    public void process(Long cvId) {
        try {
            transactions.claim(cvId).ifPresent(task -> {
                try (InputStream input = storage.getFile(task.path())) {
                    String text = extractor.extractText(input);
                    if (text.isBlank()) {
                        throw new PdfTextExtractor.PdfExtractionException("PDF không có đủ văn bản đọc được hoặc là ảnh scan");
                    }
                    transactions.finishPdf(task, text);
                    nlp.submit(cvId);
                } catch (Exception error) {
                    log.warn("PDF processing failed for cvId={}", cvId, error);
                    transactions.failPdf(task, error instanceof PdfTextExtractor.PdfExtractionException
                            ? error.getMessage() : "Không đọc được PDF từ kho lưu trữ, vui lòng thử lại");
                }
            });
        } catch (Exception error) {
            // Nếu DB tạm thời lỗi, poller sẽ lấy PENDING hoặc phục hồi lease PARSING hết hạn.
            log.error("PDF task interrupted for cvId={}", cvId, error);
        }
    }

    @Scheduled(fixedDelayString = "${cv.pdf.poll-ms:5000}", initialDelayString = "${cv.pdf.poll-ms:5000}")
    public void resumePending() {
        LocalDateTime before = LocalDateTime.now().minusMinutes(5);
        for (Long id : cvs.findStalePdfIds(before, PageRequest.of(0, 20))) {
            transactions.recover(id, before);
        }
        for (Long id : cvs.findPendingPdfIds(PageRequest.of(0, 20))) {
            submit(id);
        }
    }
}
