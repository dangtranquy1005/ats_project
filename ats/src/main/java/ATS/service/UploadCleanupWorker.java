package ATS.service;

import ATS.repository.PendingUploadCleanupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadCleanupWorker {
    private final CvUploadTransactions transactions;
    private final FileStorageService storage;
    private final PendingUploadCleanupRepository pending;

    public void delete(String path, boolean immediate) {
        try {
            transactions.claimCleanup(path, immediate).ifPresent(token -> {
                boolean success = false;
                try {
                    storage.deleteFile(path);
                    success = true;
                } catch (Exception error) {
                    log.warn("MinIO cleanup will be retried for {}", path, error);
                } finally {
                    transactions.finishCleanup(path, token, success);
                }
            });
        } catch (Exception error) {
            // Ticket tồn tại trong DB trước khi upload, lần bảo trì sau sẽ thử lại.
            log.warn("Could not complete cleanup for {}, keeping persistent ticket", path, error);
        }
    }

    @Scheduled(fixedDelayString = "${cv.cleanup.poll-ms:30000}", initialDelayString = "${cv.cleanup.poll-ms:30000}")
    public void retryDue() {
        for (String path : pending.findDue(LocalDateTime.now(), PageRequest.of(0, 20))) {
            delete(path, false);
        }
    }
}
