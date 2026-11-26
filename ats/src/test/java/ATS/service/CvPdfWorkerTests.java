package ATS.service;

import ATS.repository.CVRepository;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CvPdfWorkerTests {
    @Test
    void malformedPdfIsRecordedAsFailureWithOriginalFileRetained() {
        var tx = mock(CvUploadTransactions.class);
        var storage = mock(FileStorageService.class);
        var extractor = mock(PdfTextExtractor.class);
        var worker = new CvPdfWorker(Runnable::run, tx, storage, extractor, mock(CVRepository.class), mock(CvNlpWorker.class));
        var task = new CvUploadTransactions.PdfTask(1L, "cv.pdf", "token");
        when(tx.claim(1L)).thenReturn(Optional.of(task));
        when(storage.getFile("cv.pdf")).thenReturn(new ByteArrayInputStream(new byte[]{1}));
        when(extractor.extractText(any(InputStream.class)))
                .thenThrow(new PdfTextExtractor.PdfExtractionException("PDF lỗi"));
        worker.submit(1L);
        verify(tx).failPdf(task, "PDF lỗi");
        verify(storage, never()).deleteFile(any());
        verify(tx, never()).finishPdf(any(), any());
    }

    @Test
    void fullQueueLeavesCommittedPendingCvAvailableForPoller() {
        TaskExecutor executor = mock(TaskExecutor.class);
        doThrow(new TaskRejectedException("full")).when(executor).execute(any());
        var tx = mock(CvUploadTransactions.class);
        var worker = new CvPdfWorker(executor, tx, mock(FileStorageService.class),
                mock(PdfTextExtractor.class), mock(CVRepository.class), mock(CvNlpWorker.class));
        assertDoesNotThrow(() -> worker.submit(1L));
        verifyNoInteractions(tx);
    }
}
