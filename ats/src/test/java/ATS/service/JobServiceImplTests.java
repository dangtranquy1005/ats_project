package ATS.service;

import ATS.dto.JobSkillRequest;
import ATS.dto.ScoringConfigRequest;
import ATS.entities.Job;
import ATS.entities.JobRequiredSkill;
import ATS.entities.Skills;
import ATS.repository.JobRepository;
import ATS.repository.SkillRepository;
import ATS.repository.UserRepository;
import ATS.service.impl.JobServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JobServiceImplTests {
    private JobRepository jobs;
    private SkillRepository skills;
    private JobServiceImpl service;
    private Job job;

    @BeforeEach
    void setUp() {
        jobs = mock(JobRepository.class);
        skills = mock(SkillRepository.class);
        service = new JobServiceImpl(jobs, skills, mock(UserRepository.class));
        job = new Job();
        job.setJobId(10L);
        when(jobs.findByJobIdAndUserId(10L, 1L)).thenReturn(Optional.of(job));
        when(jobs.findOwnedForUpdate(10L, 1L)).thenReturn(Optional.of(job));
    }

    @Test
    void anotherOwnerCannotReadOrConfigureJob() {
        when(jobs.findByJobIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.getJob(10L, 2L)).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.updateConfig(10L, new ScoringConfigRequest(), 2L)).getStatusCode());
        verifyNoInteractions(skills);
    }

    @Test
    void invalidWeightsLeaveConfigurationIntact() {
        job.setW1(0.5);
        job.setW2(0.3);
        job.setW3(0.2);
        for (Double bad : new Double[]{null, Double.NaN, Double.POSITIVE_INFINITY, -0.1, 1.1, 0.4}) {
            ScoringConfigRequest request = new ScoringConfigRequest(bad, 0.3, 0.2, null, null);
            assertThrows(ResponseStatusException.class, () -> service.updateConfig(10L, request, 1L));
            assertEquals(0.5, job.getW1());
            assertEquals(0.3, job.getW2());
            assertEquals(0.2, job.getW3());
        }
        service.updateConfig(10L, new ScoringConfigRequest(0.6, 0.3, 0.1, null, null), 1L);
        assertEquals(0.6, job.getW1());
    }

    @Test
    void changingWeightsInvalidatesExistingScore() {
        ATS.entities.CVs cv = new ATS.entities.CVs();
        ATS.entities.MatchResult result = new ATS.entities.MatchResult();
        result.setAlgorithmVersion("weighted-coverage-v1");
        cv.setMatchResult(result);
        job.getCvs().add(cv);
        service.updateConfig(10L, new ScoringConfigRequest(0.5, 0.3, 0.2, null, null), 1L);
        assertNull(result.getAlgorithmVersion());
    }

    @Test
    void replacingSkillsReusesExistingCompositeKeyAndSupportsLegacyWeight() {
        Skills skill = new Skills();
        skill.setSkillId(20L);
        skill.setCanonicalName("Java");
        JobRequiredSkill existing = new JobRequiredSkill();
        existing.setJob(job);
        existing.setSkill(skill);
        existing.setWeight(null);
        job.getRequiredSkills().add(existing);
        when(skills.findById(20L)).thenReturn(Optional.of(skill));
        assertEquals(1.0, service.getRequiredSkills(10L, 1L).get(0).getWeight());

        // The same association must be updated, avoiding a delete/insert of its composite key.
        JobSkillRequest request = new JobSkillRequest(20L, false, 2.0);
        // getRequiredSkills is sufficient to inspect changes without mapping an unrelated owner.
        ATS.entities.User owner = new ATS.entities.User();
        owner.setId(1L);
        job.setUser(owner);
        service.replaceRequiredSkills(10L, List.of(request), 1L);
        service.replaceRequiredSkills(10L, List.of(request), 1L);
        assertEquals(1, job.getRequiredSkills().size());
        assertSame(existing, job.getRequiredSkills().get(0));
        assertFalse(existing.isMandatory());
        assertEquals(2.0, existing.getWeight());
        service.replaceRequiredSkills(10L, List.of(), 1L);
        assertTrue(job.getRequiredSkills().isEmpty());
    }
}
