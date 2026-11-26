package ATS.service;

import ATS.dto.*;
import ATS.entities.User;
import ATS.repository.JobRepository;
import ATS.repository.SkillRepository;
import ATS.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;

import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

/** HTTP thật + PostgreSQL thật, fixture riêng và dọn sau mỗi test. */
@EnabledIfEnvironmentVariable(named = "ATS_RUN_DB_TESTS", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.show-sql=false",
        "spring.docker.compose.enabled=false", "ats.skills.seed.enabled=false",
        "cv.pdf.poll-ms=3600000", "cv.cleanup.poll-ms=3600000", "nlp.poll-ms=3600000"
})
class MilestoneOneIntegrationTests {
    @MockitoBean FileStorageService storage;
    @MockitoBean NlpClient nlp;
    @Autowired Environment environment;
    @Autowired UserRepository users;
    @Autowired JobRepository jobs;
    @Autowired SkillRepository skills;
    @Autowired ATS.repository.CVRepository cvs;
    @Autowired ScoringService scoring;
    RestClient anonymous;
    List<Long> fixtureUsers = new ArrayList<>();

    @BeforeEach void setup() {
        anonymous = RestClient.create("http://127.0.0.1:" + environment.getProperty("local.server.port"));
    }

    @AfterEach void cleanup() {
        for (Long id : fixtureUsers) {
            jobs.findByUserId(id, Pageable.unpaged()).forEach(j -> jobs.deleteById(j.getJobId()));
            users.deleteById(id);
        }
    }

    @SuppressWarnings("unchecked")
    RestClient registerAndLogin() {
        String email = "milestone-one-" + UUID.randomUUID() + "@example.invalid";
        var account = Map.of("fullname", "Mốc một", "email", email, "password", "FixturePassword42!", "role", "ADMIN");
        anonymous.post().uri("/api/v1/user/create").body(account).retrieve().toBodilessEntity();
        User user = users.findByEmail(email).orElseThrow();
        assertEquals(ATS.enums.Role.RECRUITER, user.getRole());
        fixtureUsers.add(user.getId());
        assertEquals(400, assertThrows(HttpClientErrorException.class, () -> anonymous.post()
                .uri("/api/v1/user/create").body(account).retrieve().toBodilessEntity()).getStatusCode().value());
        assertEquals(401, assertThrows(HttpClientErrorException.class, () -> anonymous.post()
                .uri("/api/v1/user/login").body(Map.of("email", email, "password", "wrong"))
                .retrieve().toBodilessEntity()).getStatusCode().value());
        Map<String, Object> response = anonymous.post().uri("/api/v1/user/login")
                .body(account).retrieve().body(Map.class);
        String token = (String) ((Map<String, Object>) response.get("result")).get("token");
        return RestClient.builder().baseUrl("http://127.0.0.1:" + environment.getProperty("local.server.port"))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token).build();
    }

    @Test @SuppressWarnings("unchecked")
    void sessionAndJobCriteriaPersistAndRejectPartialUpdates() {
        RestClient client = registerAndLogin();
        Map<String, Object> me = client.get().uri("/api/v1/user/me").retrieve().body(Map.class);
        Map<String, Object> profile = (Map<String, Object>) me.get("result");
        assertEquals("Mốc một", profile.get("fullName"));
        assertFalse(profile.containsKey("password"));
        assertFalse(profile.containsKey("passwordHash"));
        assertEquals(401, anonymous.get().uri("/api/v1/user/me").<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(401, anonymous.get().uri("/api/v1/user/me").header(HttpHeaders.AUTHORIZATION, "Bearer invalid")
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());

        Long skillId = skills.findAll().get(0).getSkillId();
        Map<String, Object> body = new HashMap<>(Map.of("title", "Milestone fixture", "description", "Initial description",
                "minExperienceYears", 0, "requiredSkills", List.of(Map.of("skillId", skillId, "mandatory", false, "weight", 2.5))));
        body.put("educationRequirements", "Đại học");
        JobResponse created = client.post().uri("/api/v1/jobs").body(body).retrieve().body(JobResponse.class);
        assertEquals("UNIVERSITY", created.getEducationRequirements());
        String path = "/api/v1/jobs/" + created.getJobId();
        JobDetailResponse loaded = client.get().uri(path).retrieve().body(JobDetailResponse.class);
        assertEquals(0, loaded.getMinExperienceYears());
        assertEquals("UNIVERSITY", loaded.getEducationRequirements());
        assertEquals(2.5, loaded.getRequiredSkills().get(0).getWeight());
        assertFalse(loaded.getRequiredSkills().get(0).isMandatory());

        body.put("title", "Must roll back");
        body.put("requiredSkills", List.of(Map.of("skillId", Long.MAX_VALUE, "mandatory", true, "weight", 1)));
        assertEquals(400, assertThrows(HttpClientErrorException.class, () -> client.put().uri(path).body(body)
                .retrieve().toBodilessEntity()).getStatusCode().value());
        assertEquals("Milestone fixture", client.get().uri(path).retrieve().body(JobDetailResponse.class).getTitle());
        // Việc tạo cũng phải rollback nếu một kỹ năng không tồn tại.
        assertEquals(400, assertThrows(HttpClientErrorException.class, () -> client.post().uri("/api/v1/jobs").body(body)
                .retrieve().toBodilessEntity()).getStatusCode().value());
        assertEquals(1, jobs.findByUserId(fixtureUsers.get(0), Pageable.unpaged()).getTotalElements());

        body.put("title", "Updated fixture");
        body.put("requiredSkills", List.of(Map.of("skillId", skillId, "mandatory", true, "weight", 0.5)));
        client.put().uri(path).body(body).retrieve().toBodilessEntity();
        loaded = client.get().uri(path).retrieve().body(JobDetailResponse.class);
        assertEquals("Updated fixture", loaded.getTitle());
        assertEquals(0.5, loaded.getRequiredSkills().get(0).getWeight());
        assertTrue(loaded.getRequiredSkills().get(0).isMandatory());
        client.put().uri(path + "/scoring-config").body(Map.of("jaccardWeight", 0.6, "cosineWeight", 0.3, "educationWeight", 0.1))
                .retrieve().toBodilessEntity();
        assertEquals(0.6, client.get().uri(path + "/scoring-config").retrieve().body(ScoringConfigResponse.class).getJaccardWeight());
        client.patch().uri(path + "/status").body(Map.of("status", "CLOSED")).retrieve().toBodilessEntity();
        assertEquals(ATS.enums.JobStatus.CLOSED, client.get().uri(path).retrieve().body(JobDetailResponse.class).getStatus());
        RestClient other = registerAndLogin();
        assertEquals(404, other.get().uri(path).<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        client.delete().uri(path).retrieve().toBodilessEntity();
        assertEquals(ATS.enums.JobStatus.CLOSED, client.get().uri(path).retrieve().body(JobDetailResponse.class).getStatus());
        assertTrue(jobs.existsById(created.getJobId()));
    }

    @Test
    void deletingJobWithCvKeepsNlpSkillsScoreAndStoredFileReference() {
        RestClient client = registerAndLogin();
        var selectedSkill = skills.findAll().get(0);
        var job = client.post().uri("/api/v1/jobs")
                .body(Map.of("title", "Close with CV fixture", "minExperienceYears", 0,
                        "requiredSkillIds", List.of(selectedSkill.getSkillId())))
                .retrieve().body(JobResponse.class);
        var cv = new ATS.entities.CVs();
        cv.setJob(jobs.findById(job.getJobId()).orElseThrow());
        cv.setFilePath("test/close-job-" + UUID.randomUUID() + ".pdf");
        cv.setRawText("Java backend developer");
        cv.setRawNlpResult("{\"candidateName\":\"Fixture\"}");
        cv.setStatus(ATS.enums.CVStatus.PARSED);
        var skill = new ATS.entities.CVSkills();
        skill.setCv(cv); skill.setSkill(selectedSkill); skill.setMatchMethod(ATS.enums.MatchMethod.EXACT);
        cv.getCvSkills().add(skill);
        cv = cvs.saveAndFlush(cv);
        scoring.rescore(job.getJobId(), fixtureUsers.get(0));
        var before = client.get().uri("/api/v1/cvs/" + cv.getCvId()).retrieve().body(CvExtractionDetail.class);
        String path = "/api/v1/jobs/" + job.getJobId();
        client.delete().uri(path).retrieve().toBodilessEntity();
        client.delete().uri(path).retrieve().toBodilessEntity();
        assertEquals(ATS.enums.JobStatus.CLOSED, client.get().uri(path).retrieve().body(JobDetailResponse.class).getStatus());
        var after = client.get().uri("/api/v1/cvs/" + cv.getCvId()).retrieve().body(CvExtractionDetail.class);
        assertEquals(before, after);
        var status = client.get().uri(path + "/scoring-status").retrieve().body(ScoringStatusResponse.class);
        assertEquals(1, status.currentCvs()); assertEquals(1, status.totalCvs());
        assertTrue(cvs.existsById(cv.getCvId()));
        org.mockito.Mockito.verify(storage, org.mockito.Mockito.never()).deleteFile(org.mockito.ArgumentMatchers.anyString());
    }
}

