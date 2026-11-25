package ATS.service;

import ATS.dto.CvUploadResult;
import ATS.entities.Job;
import ATS.enums.CVStatus;
import ATS.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CvUploadServiceTests {
    private FileStorageService storage;
    private CvUploadTransactions transactions;
    private UploadCleanupWorker cleanup;
    private CvPdfWorker worker;
    private CvUploadService service;

    @BeforeEach
    void setUp() {
        storage = mock(FileStorageService.class);
        transactions = mock(CvUploadTransactions.class);
        cleanup = mock(UploadCleanupWorker.class);
        worker = mock(CvPdfWorker.class);
        JobRepository jobs = mock(JobRepository.class);
        when(jobs.findByJobIdAndUserId(10L, 1L)).thenReturn(Optional.of(new Job()));
        service = new CvUploadService(storage, jobs, transactions, cleanup, worker);
    }

    private MockMultipartFile file(String name) {
        return new MockMultipartFile("files", name, "application/pdf", new byte[]{1, 2});
    }

    @Test
    void uploadReturnsCommittedPendingCvAndDispatchesOnlyId() {
        var file = file("cv.pdf");
        when(storage.newFilePath(1L, 10L)).thenReturn("path.pdf");
        when(transactions.register(10L, 1L, "path.pdf", "cv.pdf")).thenReturn(
                CvUploadResult.builder().cvId(20L).status(CVStatus.PENDING).success(true).build());
        var result = service.uploadCvs(10L, List.of(file), 1L).get(0);
        assertTrue(result.getSuccess());
        assertEquals(20L, result.getCvId());
        assertNull(result.getEmail());
        var order = inOrder(transactions, storage, worker);
        order.verify(transactions).reserve("path.pdf");
        order.verify(storage).uploadFile(file, "path.pdf");
        order.verify(transactions).register(10L, 1L, "path.pdf", "cv.pdf");
        order.verify(worker).submit(20L);
        verifyNoInteractions(cleanup);
    }

    @Test
    void databaseFailureCompensatesOnlyFailedFileAndContinuesBatch() {
        when(storage.newFilePath(1L, 10L)).thenReturn("first.pdf", "second.pdf", "third.pdf");
        when(transactions.register(10L, 1L, "first.pdf", "a.pdf")).thenReturn(
                CvUploadResult.builder().cvId(1L).success(true).build());
        when(transactions.register(10L, 1L, "second.pdf", "b.pdf"))
                .thenThrow(new IllegalStateException("commit failed"));
        when(transactions.register(10L, 1L, "third.pdf", "c.pdf")).thenReturn(
                CvUploadResult.builder().cvId(3L).success(true).build());
        var result = service.uploadCvs(10L, List.of(file("a.pdf"), file("b.pdf"), file("c.pdf")), 1L);
        assertEquals(List.of(true, false, true), result.stream().map(CvUploadResult::getSuccess).toList());
        verify(cleanup).delete("second.pdf", true);
        verify(cleanup, never()).delete("first.pdf", true);
        verify(worker).submit(1L);
        verify(worker).submit(3L);
        verifyNoMoreInteractions(worker);
    }

    @Test
    void storageFailureUsesPreRegisteredCleanupTicket() {
        when(storage.newFilePath(1L, 10L)).thenReturn("failed.pdf");
        doThrow(new IllegalStateException("network")).when(storage).uploadFile(any(), eq("failed.pdf"));
        assertFalse(service.uploadCvs(10L, List.of(file("cv.pdf")), 1L).get(0).getSuccess());
        verify(transactions).reserve("failed.pdf");
        verify(cleanup).delete("failed.pdf", true);
        verify(transactions, never()).register(any(), any(), any(), any());
        verifyNoInteractions(worker);
    }

    @Test
    void invalidExtensionAndEmptyFileDoNotReachStorage() {
        var empty = new MockMultipartFile("files", "empty.pdf", "application/pdf", new byte[0]);
        var result = service.uploadCvs(10L, List.of(file("cv.docx"), empty), 1L);
        assertTrue(result.stream().noneMatch(CvUploadResult::getSuccess));
        verifyNoInteractions(storage, transactions, cleanup, worker);
    }
}
