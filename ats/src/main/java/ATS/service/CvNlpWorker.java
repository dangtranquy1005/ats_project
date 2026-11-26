package ATS.service;

import ATS.config.NlpClientProperties;
import ATS.dto.AnalyzeRequest;
import org.springframework.beans.factory.annotation.*;
import org.springframework.core.task.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.time.*;

/** Điều phối NLP ngoài transaction DB. Mỗi lần claim/lưu/lỗi là một transaction riêng. */
@Slf4j
@Service
public class CvNlpWorker {
    private final TaskExecutor executor;
    private final CvProcessingTx transactions;
    private final NlpClient client;
    private final int maxAttempts;
    private final Duration retryDelay;
    private final Duration lease;

    public CvNlpWorker(@Qualifier("cvNlpExecutor") TaskExecutor executor, CvProcessingTx transactions,
                       NlpClient client, NlpClientProperties properties,
                       @Value("${nlp.max-attempts:3}") int maxAttempts,
                       @Value("${nlp.retry-delay:1s}") Duration retryDelay) {
        if (maxAttempts < 1 || retryDelay.isNegative()) {
            throw new IllegalArgumentException("NLP cần max-attempts >= 1 và retry-delay >= 0");
        }
        this.executor = executor;
        this.transactions = transactions;
        this.client = client;
        this.maxAttempts = maxAttempts;
        this.retryDelay = retryDelay;
        Duration budget = properties.connectTimeout().plus(properties.readTimeout())
                .multipliedBy(maxAttempts).plus(retryDelay.multipliedBy(maxAttempts - 1L)).plusMinutes(1);
        this.lease = budget.compareTo(Duration.ofMinutes(5)) > 0 ? budget : Duration.ofMinutes(5);
    }

    public void submit(Long id) {
        try {
            executor.execute(() -> process(id));
        } catch (TaskRejectedException error) {
            log.info("NLP executor busy; cvId={} remains pending", id);
        }
    }

    public void process(Long id) {
        try {
            transactions.claimPendingRequest(id).ifPresent(this::analyze);
        } catch (Exception error) {
            // DB lỗi trước/sau HTTP được poller lấy lại hoặc phục hồi khi lease hết hạn.
            log.error("NLP task interrupted for cvId={}", id, error);
        }
    }

    private void analyze(AnalyzeRequest request) {
        try {
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                ATS.dto.AnalyzeResponse response;
                try {
                    response = client.analyze(request);
                } catch (NlpClientException error) {
                    if (!error.isRetryable() || attempt == maxAttempts) {
                        throw error;
                    }
                    // Chờ hữu hạn trên worker, không giữ transaction hoặc khóa DB.
                    Thread.sleep(retryDelay.toMillis());
                    continue;
                }
                // Lỗi ghi DB không gọi lại HTTP trong vòng retry này.
                transactions.saveResult(request.getCvId(), response);
                return;
            }
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            transactions.markFailed(request.getCvId(), request.getProcessingToken(), "Tác vụ NLP bị gián đoạn");
        } catch (Exception error) {
            String reason = error instanceof NlpClientException ? error.getMessage()
                    : "Không lưu được kết quả phân tích NLP, vui lòng thử lại";
            transactions.markFailed(request.getCvId(), request.getProcessingToken(), reason);
            log.warn("NLP failed for cvId={}", request.getCvId());
        }
    }

    @Scheduled(fixedDelayString = "${nlp.poll-ms:5000}", initialDelayString = "${nlp.poll-ms:5000}")
    public void resumePending() {
        transactions.resetStaleProcessing(Instant.now().minus(lease));
        transactions.findStalePendingIds(Instant.now()).stream().limit(20).forEach(this::submit);
    }
}
