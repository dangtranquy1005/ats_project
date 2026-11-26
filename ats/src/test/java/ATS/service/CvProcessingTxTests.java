package ATS.service;

import ATS.dto.*;
import ATS.entities.*;
import ATS.enums.*;
import ATS.repository.*;
import ATS.service.impl.CvProcessingTxImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CvProcessingTxTests {
    private CVRepository cvs;
    private SkillRepository skills;
    private CvProcessingTxImpl tx;
    private CVs cv;
    private NlpSkillDictionary dictionary;

    @BeforeEach
    void setUp() {
        cvs = mock(CVRepository.class);
        skills = mock(SkillRepository.class);
        dictionary = mock(NlpSkillDictionary.class);
        tx = new CvProcessingTxImpl(cvs, skills, dictionary, new NlpResultMapper(), JsonMapper.builder().build());
        cv = new CVs();
        cv.setCvId(10L);
        cv.setRawText("Skills: Java");
        when(cvs.findLocked(10L)).thenReturn(Optional.of(cv));
        when(cvs.findById(10L)).thenReturn(Optional.of(cv));
        when(dictionary.snapshot()).thenReturn(List.of());
    }

    private AnalyzeResponse response(String token) {
        return AnalyzeResponse.builder().cvId(10L).processingToken(token)
                .skills(List.of()).experiences(List.of()).educations(List.of()).build();
    }

    @Test
    void claimRequiresTextAndNeverClaimsPdfOrAlreadyRunningWork() {
        cv.setRawText(null);
        assertFalse(tx.claim(10L));
        cv.setRawText("Skills: Java");
        cv.setPdfProcessingToken("pdf-task");
        assertTrue(tx.claimRequest(10L).isEmpty());
        cv.setPdfProcessingToken(null);
        var request = tx.claimRequest(10L).orElseThrow();
        assertNotNull(request.getProcessingToken());
        assertEquals(cv.getNlpProcessingToken(), request.getProcessingToken());
        assertEquals(CVStatus.PARSING, cv.getStatus());
        assertFalse(tx.claim(10L));
    }

    @Test
    void successfulSaveDeduplicatesSkillsAndKeepsKnownContactWhenMissingInResponse() {
        cv.setEmail("known@example.com");
        String token = tx.claimRequest(10L).orElseThrow().getProcessingToken();
        Skills skill = new Skills();
        skill.setSkillId(1L);
        when(skills.findAllById(any())).thenReturn(List.of(skill));
        AnalyzeResponse response = response(token);
        response.setSkills(List.of(
                new AnalyzeResponse.Skill(1L, null, "Java", "Java", null, MatchMethod.ALIAS, 1.0, 0, 4),
                new AnalyzeResponse.Skill(1L, null, "Java", "Java", null, MatchMethod.EXACT, 1.0, 0, 4)));
        tx.saveResult(10L, response);
        assertEquals(1, cv.getCvSkills().size());
        assertEquals(MatchMethod.EXACT, cv.getCvSkills().get(0).getMatchMethod());
        assertEquals("known@example.com", cv.getEmail());
        assertEquals(CVStatus.PARSED, cv.getStatus());
        assertNull(cv.getNlpProcessingToken());
        assertFalse(cv.getRawNlpResult().contains("processingToken"));
        assertThrows(ResponseStatusException.class, () -> tx.saveResult(10L, response));
    }

    @Test
    void invalidSkillIdsAreRejectedBeforeClearingExistingData() {
        String token = tx.claimRequest(10L).orElseThrow().getProcessingToken();
        CVSkills original = new CVSkills();
        cv.getCvSkills().add(original);
        AnalyzeResponse response = response(token);
        response.setSkills(List.of(new AnalyzeResponse.Skill(99L, null, "Java", "Java", null,
                MatchMethod.EXACT, 1.0, 0, 4)));
        when(skills.findAllById(any())).thenReturn(List.of());
        assertThrows(ResponseStatusException.class, () -> tx.saveResult(10L, response));
        assertSame(original, cv.getCvSkills().get(0));
        verify(cvs, never()).flush();
    }

    @Test
    void pendingWorkerDoesNotReprocessCompletedCvQueuedTwice() {
        cv.setStatus(CVStatus.PARSED);
        assertTrue(tx.claimPendingRequest(10L).isEmpty());
        // Claim thủ công vẫn hỗ trợ yêu cầu phân tích lại rõ ràng.
        assertTrue(tx.claimRequest(10L).isPresent());
    }

    @Test
    void recoveredTaskRejectsLateResultAndLateFailure() {
        String old = tx.claimRequest(10L).orElseThrow().getProcessingToken();
        cv.setNlpProcessingStartedAt(LocalDateTime.now().minusMinutes(10));
        when(cvs.findStaleNlpIds(any())).thenReturn(List.of(10L));
        assertEquals(1, tx.resetStaleProcessing(Instant.now().minusSeconds(300)));
        String current = tx.claimRequest(10L).orElseThrow().getProcessingToken();
        assertThrows(ResponseStatusException.class, () -> tx.saveResult(10L, response(old)));
        tx.markFailed(10L, old, "late error");
        assertEquals(current, cv.getNlpProcessingToken());
        assertEquals(CVStatus.PARSING, cv.getStatus());
        tx.markFailed(10L, current, "timeout");
        assertEquals(CVStatus.PARSED_FAILED, cv.getStatus());
        assertEquals("timeout", cv.getErrorMessage());
    }
}
