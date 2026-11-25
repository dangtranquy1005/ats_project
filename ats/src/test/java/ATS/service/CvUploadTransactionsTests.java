package ATS.service;

import ATS.entities.*;
import ATS.enums.CVStatus;
import ATS.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CvUploadTransactionsTests {
    private CVRepository cvs;
    private PendingUploadCleanupRepository pending;
    private CvUploadTransactions tx;
    private CVs cv;

    @BeforeEach
    void setUp() {
        cvs = mock(CVRepository.class);
        pending = mock(PendingUploadCleanupRepository.class);
        tx = new CvUploadTransactions(cvs, mock(JobRepository.class), pending);
        cv = new CVs();
        cv.setCvId(1L);
        cv.setFilePath("cv.pdf");
        when(cvs.findLocked(1L)).thenReturn(Optional.of(cv));
    }

    @Test
    void databaseWritesRequireIndependentTransaction() {
        assertEquals(Propagation.REQUIRES_NEW,
                CvUploadTransactions.class.getAnnotation(Transactional.class).propagation());
    }

    @Test
    void duplicateClaimCannotRunPdfTwiceAndSuccessfulTextWaitsForNlp() {
        var task = tx.claim(1L).orElseThrow();
        assertEquals(CVStatus.PARSING, cv.getStatus());
        assertTrue(tx.claim(1L).isEmpty());
        tx.finishPdf(task, "Java Spring Boot");
        assertEquals(CVStatus.PENDING, cv.getStatus());
        assertEquals("Java Spring Boot", cv.getRawText());
        assertNull(cv.getPdfProcessingToken());
        assertTrue(tx.claim(1L).isEmpty());
    }

    @Test
    void lateWorkerCannotOverwriteRecoveredTask() {
        var old = tx.claim(1L).orElseThrow();
        cv.setPdfProcessingStartedAt(LocalDateTime.now().minusMinutes(10));
        tx.recover(1L, LocalDateTime.now().minusMinutes(5));
        var current = tx.claim(1L).orElseThrow();
        tx.finishPdf(old, "stale text");
        tx.failPdf(old, "stale failure");
        assertNull(cv.getRawText());
        assertEquals(current.token(), cv.getPdfProcessingToken());
        tx.finishPdf(current, "current text");
        assertEquals("current text", cv.getRawText());
    }

    @Test
    void parseFailureKeepsFileAndSupportsOwnedRetry() {
        User user = new User();
        user.setId(2L);
        Job job = new Job();
        job.setUser(user);
        cv.setJob(job);
        var task = tx.claim(1L).orElseThrow();
        tx.failPdf(task, "PDF scan");
        assertEquals(CVStatus.PARSED_FAILED, cv.getStatus());
        assertEquals("cv.pdf", cv.getFilePath());
        assertEquals("PDF scan", cv.getErrorMessage());
        assertThrows(ResponseStatusException.class, () -> tx.retry(1L, 99L));
        assertEquals(CVStatus.PENDING, tx.retry(1L, 2L).getStatus());
        assertNull(cv.getErrorMessage());
        assertThrows(ResponseStatusException.class, () -> tx.retry(1L, 2L));
    }

    @Test
    void successfulRegistrationTicketCannotBeClaimedForDeletion() {
        when(pending.findLocked("committed.pdf")).thenReturn(Optional.empty());
        assertTrue(tx.claimCleanup("committed.pdf", true).isEmpty());
    }

    @Test
    void cleanupFailureKeepsDurableTicketForRetryAndRejectsLateCompletion() {
        PendingUploadCleanup ticket = new PendingUploadCleanup();
        ticket.setFilePath("orphan.pdf");
        ticket.setEligibleAt(LocalDateTime.now().minusMinutes(1));
        when(pending.findLocked("orphan.pdf")).thenReturn(Optional.of(ticket));
        String first = tx.claimCleanup("orphan.pdf", false).orElseThrow();
        tx.finishCleanup("orphan.pdf", first, false);
        verify(pending, never()).delete(any());
        assertTrue(ticket.getEligibleAt().isAfter(LocalDateTime.now()));
        String next = tx.claimCleanup("orphan.pdf", true).orElseThrow();
        tx.finishCleanup("orphan.pdf", first, true);
        verify(pending, never()).delete(any());
        tx.finishCleanup("orphan.pdf", next, true);
        verify(pending).delete(ticket);
    }
}
