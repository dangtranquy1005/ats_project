package ATS.service;

import ATS.repository.JobRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;

class AutoScoringWorkerTests {
    @Test void continuesPastFailedJobAndWrapsCursorForRetry() {
        var jobs=mock(JobRepository.class);var scoring=mock(ScoringService.class);
        var first=mock(JobRepository.ScoringTarget.class);when(first.getJobId()).thenReturn(1L);when(first.getUserId()).thenReturn(7L);
        var second=mock(JobRepository.ScoringTarget.class);when(second.getJobId()).thenReturn(2L);when(second.getUserId()).thenReturn(8L);
        when(jobs.findJobsNeedingScoring(eq(ScoringService.ALGORITHM_VERSION),eq(0L),any())).thenReturn(List.of(first,second));
        when(jobs.findJobsNeedingScoring(eq(ScoringService.ALGORITHM_VERSION),eq(2L),any())).thenReturn(List.of());
        when(scoring.scorePending(1L,7L)).thenThrow(new IllegalStateException("temporary failure"));
        var worker=new AutoScoringWorker(jobs,scoring);worker.processPending();worker.processPending();
        verify(scoring,times(2)).scorePending(1L,7L);verify(scoring,times(2)).scorePending(2L,8L);
    }
}
