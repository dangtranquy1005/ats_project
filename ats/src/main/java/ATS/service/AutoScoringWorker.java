package ATS.service;

import ATS.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/** PostgreSQL là nguồn công việc: không mất CV cần chấm khi restart hoặc tác vụ trước bị lỗi. */
@Service @Slf4j @RequiredArgsConstructor
@ConditionalOnProperty(name="ats.scoring.auto.enabled",havingValue="true",matchIfMissing=true)
public class AutoScoringWorker {
    private final JobRepository jobs;
    private final ScoringService scoring;
    private long afterJobId;
    @Scheduled(fixedDelayString="${ats.scoring.auto.poll-ms:3000}",initialDelayString="${ats.scoring.auto.poll-ms:3000}")
    public void processPending() {
        var targets=jobs.findJobsNeedingScoring(ScoringService.ALGORITHM_VERSION,afterJobId,PageRequest.of(0,20));
        if(targets.isEmpty() && afterJobId!=0) {
            afterJobId=0;
            targets=jobs.findJobsNeedingScoring(ScoringService.ALGORITHM_VERSION,afterJobId,PageRequest.of(0,20));
        }
        for(var target:targets) {
            try {
                scoring.scorePending(target.getJobId(),target.getUserId());
            } catch(Exception ex) {
                // Lỗi chấm không được đổi CV đã phân tích thành lỗi NLP; giữ để thử lại ở lượt sau.
                log.warn("Automatic scoring failed for jobId={}; pending scores will be retried",target.getJobId());
            } finally {
                // Luân phiên JD để một nhóm dữ liệu lỗi không chặn các JD phía sau.
                afterJobId=target.getJobId();
            }
        }
    }
}
