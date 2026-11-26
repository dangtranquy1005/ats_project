package ATS.service;

import ATS.config.NlpClientProperties;
import ATS.dto.*;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.*;
import java.net.URI;
import java.time.Duration;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CvNlpWorkerTests {
    private CvNlpWorker worker(TaskExecutor executor, CvProcessingTx tx, NlpClient client) {
        return new CvNlpWorker(executor, tx, client,
                new NlpClientProperties(URI.create("http://localhost:8000"),
                        Duration.ofSeconds(3), Duration.ofSeconds(30)), 3, Duration.ZERO);
    }

    private AnalyzeRequest request(CvProcessingTx tx) {
        AnalyzeRequest request = new AnalyzeRequest(1L, "Java", "pdf");
        request.setProcessingToken("token");
        when(tx.claimPendingRequest(1L)).thenReturn(Optional.of(request));
        return request;
    }

    @Test
    void transientHttpFailureRetriesBeforeSavingOnce() {
        CvProcessingTx tx = mock(CvProcessingTx.class);
        NlpClient client = mock(NlpClient.class);
        var request = request(tx);
        var response = new AnalyzeResponse();
        when(client.analyze(request)).thenThrow(new NlpClientException(
                NlpClientException.Reason.TIMEOUT, "timeout", null, true, null)).thenReturn(response);
        worker(Runnable::run, tx, client).submit(1L);
        verify(client, times(2)).analyze(request);
        verify(tx).saveResult(1L, response);
        verify(tx, never()).markFailed(any(), any(), any());
    }

    @Test
    void permanentFailureDoesNotRetryAndTransientFailureStopsAtLimit() {
        for (boolean retryable : List.of(false, true)) {
            CvProcessingTx tx = mock(CvProcessingTx.class);
            NlpClient client = mock(NlpClient.class);
            var request = request(tx);
            when(client.analyze(request)).thenThrow(new NlpClientException(
                    NlpClientException.Reason.HTTP_ERROR, "HTTP error", 503, retryable, null));
            worker(Runnable::run, tx, client).submit(1L);
            verify(client, times(retryable ? 3 : 1)).analyze(request);
            verify(tx).markFailed(1L, "token", "HTTP error");
            verify(tx, never()).saveResult(any(), any());
        }
    }

    @Test
    void databaseSaveFailureDoesNotRepeatHttpAndUsesCurrentToken() {
        CvProcessingTx tx = mock(CvProcessingTx.class);
        NlpClient client = mock(NlpClient.class);
        var request = request(tx);
        var response = new AnalyzeResponse();
        when(client.analyze(request)).thenReturn(response);
        doThrow(new IllegalStateException("DB")).when(tx).saveResult(1L, response);
        worker(Runnable::run, tx, client).submit(1L);
        verify(client, times(1)).analyze(request);
        verify(tx).markFailed(eq(1L), eq("token"), anyString());
    }

    @Test
    void duplicateOrBusyTaskDoesNotCallNlp() {
        CvProcessingTx tx = mock(CvProcessingTx.class);
        NlpClient client = mock(NlpClient.class);
        when(tx.claimPendingRequest(1L)).thenReturn(Optional.empty());
        worker(Runnable::run, tx, client).submit(1L);
        verifyNoInteractions(client);
        TaskExecutor executor = mock(TaskExecutor.class);
        doThrow(new TaskRejectedException("full")).when(executor).execute(any());
        assertDoesNotThrow(() -> worker(executor, tx, client).submit(2L));
        verify(tx, never()).claimPendingRequest(2L);
    }
}
