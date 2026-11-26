package ATS.service;

import ATS.dto.*;
import ATS.dto.RankingFilter;
import ATS.entities.*;
import ATS.enums.CVStatus;
import ATS.repository.*;
import ATS.service.impl.ScoringServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ScoringServiceImplTests {
    private JobRepository jobs;
    private CVRepository cvs;
    private MatchResultRepository results;
    private ScoringServiceImpl service;
    private Job job;
    private CVs cv;

    @BeforeEach
    void setUp() {
        jobs = mock(JobRepository.class);
        cvs = mock(CVRepository.class);
        results = mock(MatchResultRepository.class);
        service = new ScoringServiceImpl(jobs, cvs, results, mock(JobService.class), JsonMapper.builder().build());
        job = new Job();
        job.setJobId(1L);
        job.setW1(1);
        cv = new CVs();
        cv.setCvId(10L);
        cv.setCandidateName("Candidate");
        cv.setEmail("candidate@example.com");
        cv.setJob(job);
        cv.setStatus(CVStatus.PARSED);
        when(jobs.findOwnedForUpdate(1L, 2L)).thenReturn(Optional.of(job));
        when(jobs.findByJobIdAndUserId(1L, 2L)).thenReturn(Optional.of(job));
        when(cvs.findAllForScoring(1L)).thenReturn(List.of(cv));
        required(1L, "Java", 3.0, true);
        required(2L, "Spring Boot", 3.0, true);
        required(3L, "Docker", 2.0, false);
    }

    private void required(Long id, String name, Double weight, boolean mandatory) {
        Skills skill = new Skills();
        skill.setSkillId(id);
        skill.setCanonicalName(name);
        JobRequiredSkill required = new JobRequiredSkill();
        required.setJob(job);
        required.setSkill(skill);
        required.setWeight(weight);
        required.setMandatory(mandatory);
        job.getRequiredSkills().add(required);
    }

    private void available(Long... ids) {
        for (Long id : ids) {
            Skills skill = new Skills();
            skill.setSkillId(id);
            CVSkills found = new CVSkills();
            found.setSkill(skill);
            cv.getCvSkills().add(found);
        }
    }

    @Test
    void weightedCoverageIgnoresDuplicateAndUnrelatedSkillsAndPersistsExplanation() {
        available(1L, 1L, 2L, 999L);
        service.rescore(1L, 2L);
        MatchResult result = cv.getMatchResult();
        assertEquals(0.75, result.getJaccardScore(), 1e-12);
        assertEquals(0.75, result.getOverallScore(), 1e-12);
        assertTrue(result.isPassedHardFilter());
        assertEquals(CVStatus.SCORED, cv.getStatus());
        when(results.findDetail(10L, 2L)).thenReturn(Optional.of(result));
        MatchDetailResponse detail = service.getMatchDetail(10L, 2L);
        assertEquals(List.of("Java", "Spring Boot"), detail.getMatchedSkills());
        assertEquals(List.of("Docker"), detail.getMissingSkills());
        assertEquals(0.75, detail.getSkillScore(), 1e-12);
    }

    @Test
    void repeatedScoringUpdatesExistingResultAndPreservesReviewedState() {
        available(1L, 2L, 3L);
        service.rescore(1L, 2L);
        MatchResult original = cv.getMatchResult();
        original.setMatchResultId(50L);
        original.setCalculatedAt(java.time.LocalDateTime.of(2000, 1, 1, 0, 0));
        cv.setStatus(CVStatus.REVIEWED);
        cv.getCvSkills().clear();
        service.rescore(1L, 2L);
        assertSame(original, cv.getMatchResult());
        assertEquals(0, original.getJaccardScore());
        assertFalse(original.isPassedHardFilter());
        assertEquals(CVStatus.REVIEWED, cv.getStatus());
        assertTrue(original.getCalculatedAt().getYear() > 2000);
    }

    @Test
    void missingMandatorySkillFailsEvenWithHighScore() {
        job.getRequiredSkills().get(0).setWeight(0.01);
        available(2L, 3L);
        service.rescore(1L, 2L);
        assertTrue(cv.getMatchResult().getJaccardScore() > 0.99);
        assertFalse(cv.getMatchResult().isPassedHardFilter());
        when(results.findDetail(10L, 2L)).thenReturn(Optional.of(cv.getMatchResult()));
        assertEquals(List.of("Java"), service.getMatchDetail(10L, 2L).getMissingMandatorySkills());
    }

    @Test
    void emptyOrInvalidJobIsRejectedBeforeWritingScores() {
        job.getRequiredSkills().clear();
        assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 2L));
        required(1L, "Java", Double.NaN, true);
        assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 2L));
        for (double weight : new double[]{0, -1, Double.POSITIVE_INFINITY}) {
            job.getRequiredSkills().get(0).setWeight(weight);
            assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 2L));
        }
        verify(results, never()).save(any());
    }

    @Test
    void legacyNullAndVeryLargeWeightsAreSupported() {
        job.getRequiredSkills().get(0).setWeight(null);
        job.getRequiredSkills().get(1).setWeight(null);
        job.getRequiredSkills().get(2).setWeight(null);
        available(1L);
        service.rescore(1L, 2L);
        assertEquals(1.0 / 3, cv.getMatchResult().getJaccardScore(), 1e-12);
        job.getRequiredSkills().forEach(item -> item.setWeight(Double.MAX_VALUE));
        service.rescore(1L, 2L);
        assertEquals(1.0 / 3, cv.getMatchResult().getJaccardScore(), 1e-12);
    }

    @Test
    void unparsedAndFailedCandidatesAreSkipped() {
        for (CVStatus status : List.of(CVStatus.PENDING, CVStatus.PARSING, CVStatus.PARSED_FAILED)) {
            cv.setStatus(status);
            assertEquals(0, service.rescore(1L, 2L).getUpdatedCvs());
        }
        verify(results, never()).save(any());
    }

    @Test
    void otherOwnerCannotScoreRankOrReadDetails() {
        assertThrows(ResponseStatusException.class, () -> service.getScoringStatus(1L, 999L));
        assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 999L));
        assertThrows(ResponseStatusException.class, () -> service.getRanking(1L, 999L, null, PageRequest.of(0, 10)));
        assertThrows(ResponseStatusException.class, () -> service.getMatchDetail(10L, 999L));
        verify(results, never()).save(any());
    }

    @Test
    void overlappingExperienceIsNotDoubleCountedAndMissingEducationFails() {
        job.setMinExperienceYears(4);
        job.setEducationRequirements("Bachelor");
        for (int year : new int[]{2020, 2021}) {
            CVExperience experience = new CVExperience();
            experience.setStartDate(LocalDate.of(year, 1, 1));
            experience.setEndDate(LocalDate.of(year + 2, 1, 1));
            cv.getExperiences().add(experience);
        }
        available(1L, 2L, 3L);
        service.rescore(1L, 2L);
        when(results.findDetail(10L, 2L)).thenReturn(Optional.of(cv.getMatchResult()));
        assertEquals(2, service.getMatchDetail(10L, 2L).getHardFilterReasons().size());
    }

    @Test
    void cosineAndEducationContributeToTotal() {
        job.setW1(0.5);
        job.setW2(0.3);
        job.setW3(0.2);
        job.setDescription("Java Spring Boot");
        job.setEducationRequirements("Bachelor");
        CVExperience experience = new CVExperience();
        experience.setDescription("Java Spring Boot");
        cv.getExperiences().add(experience);
        CVEducation education = new CVEducation();
        education.setDegree("Bachelor");
        cv.getEducations().add(education);
        available(1L, 2L);
        service.rescore(1L, 2L);
        assertEquals(1, cv.getMatchResult().getCosineScore(), 1e-12);
        assertEquals(0.875, cv.getMatchResult().getOverallScore(), 1e-12);
    }

    @Test
    void exactCalendarYearsMeetExperienceRequirement() {
        job.setMinExperienceYears(2);
        CVExperience experience = new CVExperience();
        experience.setStartDate(LocalDate.of(2022, 1, 1));
        experience.setEndDate(LocalDate.of(2024, 1, 1));
        cv.getExperiences().add(experience);
        available(1L, 2L, 3L);
        service.rescore(1L, 2L);
        assertTrue(cv.getMatchResult().isPassedHardFilter());
        assertEquals(1, cv.getMatchResult().getJaccardScore());
    }

    @Test void educationUsesBilingualMinimumLevelAndIgnoresSchoolAndMajorNames() {
        available(1L,2L,3L); job.setEducationRequirements("Đại học");
        CVEducation education=new CVEducation();cv.getEducations().add(education);
        for(String degree:List.of("Bachelor","BSc","Kỹ sư","Master","Doctorate")) {
            education.setDegree(degree);service.rescore(1L,2L);
            assertEquals(1.0,cv.getMatchResult().getEducationScore(),degree);
            assertTrue(cv.getMatchResult().isPassedHardFilter(),degree);
        }
        for(String degree:List.of("Associate","Cao đẳng","Unknown")) {
            education.setDegree(degree);service.rescore(1L,2L);
            assertEquals(0.0,cv.getMatchResult().getEducationScore(),degree);
            assertFalse(cv.getMatchResult().isPassedHardFilter(),degree);
        }
        education.setDegree(null);education.setInstitution("Example University");education.setFieldOfStudy("Bachelor program");
        service.rescore(1L,2L);assertEquals(0.0,cv.getMatchResult().getEducationScore());
        education.setDegree("Bachelor");education.setSourceText("Pursuing Bachelor, expected 2028");
        service.rescore(1L,2L);assertFalse(cv.getMatchResult().isPassedHardFilter());
        job.setEducationRequirements("NONE");cv.getEducations().clear();
        service.rescore(1L,2L);assertTrue(cv.getMatchResult().isPassedHardFilter());
    }

    @Test
    void legacyInvalidTotalWeightsAreRejected() {
        job.setW1(0);
        assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 2L));
        job.setW1(Double.NaN);
        assertThrows(ResponseStatusException.class, () -> service.rescore(1L, 2L));
        verify(results, never()).save(any());
    }

    @Test
    void rankingPagesAreStableAndLegacyResultsRequireRescoring() {
        available(1L, 2L);
        service.rescore(1L, 2L);
        when(results.findAllByJob(1L)).thenReturn(List.of(cv.getMatchResult()));
        assertEquals(1, service.getRanking(1L, 2L, null, PageRequest.of(0, 1)).getContent().get(0).getRank());
        assertTrue(service.getRanking(1L, 2L, null, PageRequest.of(1, 1)).getContent().isEmpty());
        cv.getMatchResult().setAlgorithmVersion(null);
        assertTrue(service.getRanking(1L, 2L, null, PageRequest.of(0, 10)).getContent().isEmpty());
        when(results.findDetail(10L, 2L)).thenReturn(Optional.of(cv.getMatchResult()));
        assertThrows(ResponseStatusException.class, () -> service.getMatchDetail(10L, 2L));
    }

    @Test
    void scoringStatusDistinguishesMissingCurrentAndStaleResults() {
        job.getCvs().add(cv);
        assertEquals(1, service.getScoringStatus(1L, 2L).unscoredCvs());
        available(1L, 2L);
        service.rescore(1L, 2L);
        assertEquals(1, service.getScoringStatus(1L, 2L).currentCvs());
        assertEquals(1, service.getScoringStatus(1L, 2L).passedCvs());
        cv.getMatchResult().setAlgorithmVersion(null);
        assertEquals(1, service.getScoringStatus(1L, 2L).staleCvs());
        cv.setStatus(CVStatus.PARSING);
        assertEquals(0, service.getScoringStatus(1L, 2L).readyCvs());
        assertEquals(1, service.getScoringStatus(1L, 2L).parsingCvs());
    }

    @Test
    void explanationPersistsWeightsAndSkillEvidenceIndependentOfLaterChanges() {
        available(1L, 2L);
        service.rescore(1L, 2L);
        when(results.findDetail(10L, 2L)).thenReturn(Optional.of(cv.getMatchResult()));
        job.setW1(0.5);
        job.getRequiredSkills().get(0).setWeight(99.0);
        var detail = service.getMatchDetail(10L, 2L);
        assertEquals(1, detail.getWeights().skill());
        assertEquals(3.0, detail.getSkillBreakdown().get(0).weight());
        assertTrue(detail.getSkillBreakdown().get(0).matched());
        assertFalse(detail.getSkillBreakdown().get(2).matched());
        assertEquals(0.75, detail.getSkillScore());
    }

    @Test
    void rankingSearchHardFilterAndRangesApplyBeforePagination() {
        cv.setCandidateName("Nguyễn Minh An");
        available(1L, 2L);
        service.rescore(1L, 2L);
        when(results.findAllByJob(1L)).thenReturn(List.of(cv.getMatchResult()));
        var filter = RankingFilter.builder().query("nguyen minh").passedHardFilter(true).minScore(0.7).maxScore(1.0).build();
        assertEquals(1, service.getRanking(1L, 2L, filter, PageRequest.of(0, 1)).getTotalElements());
        filter.setPassedHardFilter(false);
        assertEquals(0, service.getRanking(1L, 2L, filter, PageRequest.of(0, 1)).getTotalElements());
        filter.setMinScore(0.9); filter.setMaxScore(0.1);
        assertThrows(ResponseStatusException.class, () -> service.getRanking(1L, 2L, filter, PageRequest.of(0, 1)));
        assertThrows(ResponseStatusException.class, () -> service.getRanking(1L, 2L, null, PageRequest.of(0, 101)));
    }
}
