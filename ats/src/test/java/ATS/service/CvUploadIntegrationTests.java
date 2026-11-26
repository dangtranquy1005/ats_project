package ATS.service;

import ATS.dto.CvUploadResult;
import ATS.entities.*;
import ATS.enums.*;
import ATS.repository.*;
import ATS.dto.CvStatusResponse;
import ATS.dto.AnalyzeResponse;
import ATS.security.TokenProvider;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Chạy khi ATS_RUN_DB_TESTS=true trên database cấu hình của dự án.
 * Tạo/xóa fixture riêng. MinIO và NlpClient dùng mock để chủ động gây lỗi,
 * worker và transaction dùng PostgreSQL thật.
 */
@EnabledIfEnvironmentVariable(named = "ATS_RUN_DB_TESTS", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.show-sql=false",
        "spring.docker.compose.enabled=false", "ats.skills.seed.enabled=false",
        "cv.pdf.poll-ms=3600000", "cv.cleanup.poll-ms=3600000", "nlp.poll-ms=3600000", "nlp.retry-delay=0s"
})
class CvUploadIntegrationTests {
    @MockitoBean FileStorageService storage;
    @MockitoBean NlpClient nlpClient;
    @Autowired ATS.service.ScoringService scoring;
    @Autowired CvUploadService uploads;
    @Autowired CvUploadTransactions transactions;
    @Autowired CvPdfWorker pdfWorker;
    @Autowired CvNlpWorker nlpWorker;
    @Autowired UploadCleanupWorker cleanup;
    @Autowired PendingUploadCleanupRepository pending;
    @Autowired CVRepository cvs;
    @Autowired JobRepository jobs;
    @Autowired UserRepository users;
    @Autowired Environment environment;
    @Autowired TokenProvider tokens;
    @Autowired CvProcessingTx nlpTransactions;
    @Autowired SkillRepository skills;
    @Autowired SkillCategoryRepository categoryRepository;
    @Autowired NlpSkillDictionary nlpDictionary;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    private User owner;
    private Job job;
    private final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    private final Set<String> paths = ConcurrentHashMap.newKeySet();

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setEmail("upload-test-" + UUID.randomUUID() + "@example.invalid");
        user.setPasswordHash("integration-fixture");
        user.setRole(Role.RECRUITER);
        user.setUserStatus(UserStatus.ACTIVE);
        owner = users.saveAndFlush(user);
        Job created = new Job();
        created.setUser(owner);
        created.setTitle("Upload integration fixture");
        job = jobs.saveAndFlush(created);
        when(storage.newFilePath(anyLong(), anyLong())).thenAnswer(invocation -> {
            String path = "test/" + UUID.randomUUID() + ".pdf";
            paths.add(path);
            return path;
        });
        doAnswer(invocation -> {
            org.springframework.web.multipart.MultipartFile file = invocation.getArgument(0);
            objects.put(invocation.getArgument(1), file.getBytes());
            return null;
        }).when(storage).uploadFile(any(), anyString());
        when(storage.getFile(anyString())).thenAnswer(invocation ->
                new ByteArrayInputStream(objects.get(invocation.getArgument(0))));
        doAnswer(invocation -> {
            objects.remove(invocation.getArgument(0));
            return null;
        }).when(storage).deleteFile(anyString());
        when(nlpClient.analyze(any())).thenAnswer(invocation -> {
            ATS.dto.AnalyzeRequest request = invocation.getArgument(0);
            var skill = request.getSkillDictionary().get(0);
            return AnalyzeResponse.builder().cvId(request.getCvId()).processingToken(request.getProcessingToken())
                    .candidateName("NLP test candidate")
                    .skills(List.of(new AnalyzeResponse.Skill(skill.id(), null, skill.canonical(),
                            skill.canonical(), skill.category(), MatchMethod.EXACT, 1.0, 0, 4)))
                    .experiences(List.of()).educations(List.of()).build();
        });
    }

    @AfterEach
    void tearDown() {
        if (job != null && jobs.existsById(job.getJobId())) {
            jobs.deleteById(job.getJobId());
        }
        paths.forEach(pending::deleteById);
        if (owner != null) {
            users.deleteById(owner.getId());
        }
    }

    @Test
    @Timeout(30)
    void committedUploadRunsInBackgroundAndFailedPdfCanBeRetried() throws Exception {
        var results = uploads.uploadCvs(job.getJobId(), List.of(validPdf(),
                new MockMultipartFile("files", "broken.pdf", "application/pdf", new byte[]{1, 2, 3}),
                new MockMultipartFile("files", "wrong.docx", "application/octet-stream", new byte[]{1})), owner.getId());
        assertEquals(List.of(true, true, false), results.stream().map(CvUploadResult::getSuccess).toList());
        Long good = results.get(0).getCvId();
        Long bad = results.get(1).getCvId();
        await(() -> Boolean.TRUE.equals(transactions.getStatus(good, owner.getId()).getTextExtracted()));
        await(() -> transactions.getStatus(bad, owner.getId()).getStatus() == CVStatus.PARSED_FAILED);
        await(() -> transactions.getStatus(good, owner.getId()).getStatus() == CVStatus.PARSED);
        assertEquals(CVStatus.PENDING, transactions.retry(bad, owner.getId()).getStatus());
        pdfWorker.submit(bad);
        await(() -> transactions.getStatus(bad, owner.getId()).getStatus() == CVStatus.PARSED_FAILED);
        for (String path : paths) {
            assertFalse(pending.existsById(path));
            assertTrue(objects.containsKey(path));
        }
    }

    @Test
    @Timeout(30)
    void authenticatedHttpUploadAndStatusUseNormalEntryPoints() throws Exception {
        String base = "http://127.0.0.1:" + environment.getProperty("local.server.port");
        var principal = org.springframework.security.core.userdetails.User
                .withUsername(owner.getEmail()).password("unused").roles("RECRUITER").build();
        String jwt = tokens.generateToken(new UsernamePasswordAuthenticationToken(principal, null));
        RestClient client = RestClient.builder().baseUrl(base)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + jwt).build();
        byte[] pdf = validPdf().getBytes();
        var form = new LinkedMultiValueMap<String, Object>();
        form.add("jobId", job.getJobId().toString());
        form.add("files", new ByteArrayResource(pdf) {
            @Override public String getFilename() { return "valid.pdf"; }
        });
        var response = client.post().uri("/api/v1/cvs/upload").body(form)
                .retrieve().toEntity(CvUploadResult[].class);
        assertEquals(202, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody()[0].getSuccess());
        Long id = response.getBody()[0].getCvId();
        await(() -> Boolean.TRUE.equals(client.get().uri("/api/v1/cvs/" + id + "/status")
                .retrieve().body(CvStatusResponse.class).getTextExtracted()));
        await(() -> transactions.getStatus(id, owner.getId()).getStatus() == CVStatus.PARSED);
        int unauthenticated = RestClient.create(base).get().uri("/api/v1/cvs/" + id + "/status")
                .exchange((request, reply) -> reply.getStatusCode().value());
        assertEquals(401, unauthenticated);
    }

    @Test
    void nlpSaveReplacesStructuredDataWithoutDuplicatingSkills() {
        Long id = nlpFixture();
        nlpTransactions.saveResult(id, nlpResponse(id, "First"));
        assertEquals(1, snapshot(id).skills());
        assertEquals(1, snapshot(id).experiences());
        nlpTransactions.saveResult(id, nlpResponse(id, "Second"));
        var updated = snapshot(id);
        assertEquals(CVStatus.PARSED, updated.status());
        assertEquals(1, updated.skills());
        assertEquals(1, updated.educations());
        assertEquals("Second", updated.name());
    }

    @Test
    void failedNlpInsertRollsBackDeletionOfPreviousStructuredData() {
        Long id = nlpFixture();
        nlpTransactions.saveResult(id, nlpResponse(id, "Original"));
        var before = snapshot(id);
        AnalyzeResponse invalid = nlpResponse(id, "x".repeat(1000));
        assertThrows(RuntimeException.class, () -> nlpTransactions.saveResult(id, invalid));
        var after = snapshot(id);
        assertEquals(before.skills(), after.skills());
        assertEquals(before.experiences(), after.experiences());
        assertEquals(before.educations(), after.educations());
        assertEquals(before.raw(), after.raw());
        assertEquals("Original", after.name());
        // Claim đã commit riêng, phản hồi lỗi không được chuyển hồ sơ sang PARSED.
        assertEquals(CVStatus.PARSING, after.status());
        nlpTransactions.markFailed(id, invalid.getProcessingToken(), "Lỗi dữ liệu thử");
        assertEquals(CVStatus.PARSED_FAILED, snapshot(id).status());
    }

    private Long nlpFixture() {
        CVs cv = new CVs();
        cv.setJob(job);
        cv.setFilePath("test/nlp-" + UUID.randomUUID() + ".pdf");
        cv.setRawText("Java Spring Boot developer");
        return cvs.saveAndFlush(cv).getCvId();
    }

    private AnalyzeResponse nlpResponse(Long id, String name) {
        var request = nlpTransactions.claimRequest(id).orElseThrow();
        var skill = request.getSkillDictionary().get(0);
        var item = new AnalyzeResponse.Skill(skill.id(), null, skill.canonical(), skill.canonical(),
                skill.category(), MatchMethod.ALIAS, 1.0, 0, 4);
        return AnalyzeResponse.builder().cvId(id).processingToken(request.getProcessingToken())
                .candidateName(name).skills(List.of(item, item))
                .experiences(List.of(new AnalyzeResponse.Experience(null, null,
                        java.time.LocalDate.of(2020, 1, 1), null, DatePrecision.YEAR, null,
                        true, "Backend", "Experience source")))
                .educations(List.of(new AnalyzeResponse.Education(null, null, "IT", 2020, "Education source")))
                .warnings(List.of("Some extracted fields are missing")).build();
    }

    private record NlpSnapshot(int skills, int experiences, int educations,
                               String raw, String name, CVStatus status) {}

    private NlpSnapshot snapshot(Long id) {
        return new org.springframework.transaction.support.TransactionTemplate(transactionManager).execute(status -> {
            CVs cv = cvs.findById(id).orElseThrow();
            return new NlpSnapshot(cv.getCvSkills().size(), cv.getExperiences().size(),
                    cv.getEducations().size(), cv.getRawNlpResult(), cv.getCandidateName(), cv.getStatus());
        });
    }

    @Test
    @Timeout(30)
    void uploadReachesParsedThenCanBeScored() throws Exception {
        Skills skill = skills.findDictionaryWithAliases().get(0);
        JobRequiredSkill required = new JobRequiredSkill();
        required.setJob(job);
        required.setSkill(skill);
        required.setMandatory(true);
        required.setWeight(1.0);
        job.getRequiredSkills().add(required);
        job.setW1(1);
        job = jobs.saveAndFlush(job);
        var uploaded = uploads.uploadCvs(job.getJobId(), List.of(validPdf()), owner.getId()).get(0);
        Long id = uploaded.getCvId();
        await(() -> transactions.getStatus(id, owner.getId()).getStatus() == CVStatus.PARSED);
        assertEquals(1, snapshot(id).skills());
        assertEquals(1, scoring.rescore(job.getJobId(), owner.getId()).getUpdatedCvs());
        assertEquals(1.0, scoring.getMatchDetail(id, owner.getId()).getSkillScore(), 1e-12);
    }

    @Test
    @Timeout(30)
    void failedNlpCanRetryWithoutReadingPdfAgain() throws Exception {
        Long id = nlpFixture();
        var attempts = new java.util.concurrent.atomic.AtomicInteger();
        doAnswer(invocation -> {
            ATS.dto.AnalyzeRequest request = invocation.getArgument(0);
            if (attempts.incrementAndGet() == 1) {
                throw new NlpClientException(NlpClientException.Reason.HTTP_ERROR, "HTTP 422", 422, false, null);
            }
            return AnalyzeResponse.builder().cvId(id).processingToken(request.getProcessingToken())
                    .skills(List.of()).experiences(List.of()).educations(List.of()).build();
        }).when(nlpClient).analyze(argThat(request -> request != null && id.equals(request.getCvId())));
        nlpWorker.submit(id);
        await(() -> transactions.getStatus(id, owner.getId()).getStatus() == CVStatus.PARSED_FAILED);
        var status = transactions.retry(id, owner.getId());
        assertTrue(status.getTextExtracted());
        nlpWorker.submit(id);
        await(() -> transactions.getStatus(id, owner.getId()).getStatus() == CVStatus.PARSED);
        assertEquals(2, attempts.get());
        verify(storage, never()).getFile(anyString());
    }

    @Test
    void databaseRegistrationFailureCompensatesUploadedObject() throws Exception {
        // JD bị xóa sau kiểm tra đầu request và trước transaction tạo CV.
        doAnswer(invocation -> {
            objects.put(invocation.getArgument(1), new byte[]{1});
            jobs.deleteById(job.getJobId());
            return null;
        }).when(storage).uploadFile(any(), anyString());
        var result = uploads.uploadCvs(job.getJobId(), List.of(validPdf()), owner.getId()).get(0);
        assertFalse(result.getSuccess());
        assertTrue(objects.isEmpty());
        paths.forEach(path -> assertFalse(pending.existsById(path)));
    }

    @Test
    void failedCleanupSurvivesInDatabaseAndCanBeRetried() throws Exception {
        doThrow(new IllegalStateException("put failed")).when(storage).uploadFile(any(), anyString());
        doThrow(new IllegalStateException("delete failed")).when(storage).deleteFile(anyString());
        assertFalse(uploads.uploadCvs(job.getJobId(), List.of(validPdf()), owner.getId()).get(0).getSuccess());
        String path = paths.iterator().next();
        assertTrue(pending.existsById(path));
        doNothing().when(storage).deleteFile(path);
        cleanup.delete(path, true);
        assertFalse(pending.existsById(path));
    }

    private MockMultipartFile validPdf() throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(40, 700);
                content.showText("Java Spring Boot PostgreSQL developer. Work experience building REST APIs and backend applications.");
                content.endText();
            }
            document.save(out);
            return new MockMultipartFile("files", "valid.pdf", "application/pdf", out.toByteArray());
        }
    }

    private CVs scoringFixture(String name, CVStatus status, Skills... found) {
        CVs cv = new CVs(); cv.setJob(job); cv.setStatus(status); cv.setCandidateName(name);
        cv.setEmail("score-fixture@example.invalid"); cv.setFilePath("test/" + UUID.randomUUID() + ".pdf");
        for (Skills skill : found) {
            CVSkills item = new CVSkills(); item.setCv(cv); item.setSkill(skill); item.setMatchMethod(MatchMethod.EXACT);
            cv.getCvSkills().add(item);
        }
        return cvs.saveAndFlush(cv);
    }

    @Test
    void scoringHttpRankingFiltersAndStaleResultsAreConsistent() {
        var dictionary = skills.findAll();
        Skills mandatory = dictionary.get(0), optional = dictionary.get(1);
        for (Skills skill : List.of(mandatory, optional)) {
            JobRequiredSkill required = new JobRequiredSkill(); required.setJob(job); required.setSkill(skill);
            required.setMandatory(skill == mandatory); required.setWeight(skill == mandatory ? 3.0 : 1.0);
            job.getRequiredSkills().add(required);
        }
        job.setW1(1); job.setW2(0); job.setW3(0); job = jobs.saveAndFlush(job);
        CVs complete = scoringFixture("Complete", CVStatus.PARSED, mandatory, optional);
        CVs partial = scoringFixture("Nguyễn Partial", CVStatus.PARSED, mandatory);
        CVs failed = scoringFixture("Missing mandatory", CVStatus.PARSED, optional);
        scoringFixture("Still processing", CVStatus.PARSING);
        scoringFixture("Broken PDF", CVStatus.PARSED_FAILED);
        RestClient client = queueClient(); String base = "/api/v1/jobs/" + job.getJobId();
        var before = client.get().uri(base + "/scoring-status").retrieve().body(ATS.dto.ScoringStatusResponse.class);
        assertEquals(3, before.unscoredCvs()); assertEquals(0, before.currentCvs());
        var receipt = client.post().uri(base + "/rescore").retrieve().body(ATS.dto.RescoreResult.class);
        assertEquals(3, receipt.getUpdatedCvs()); assertEquals(5, receipt.getTotalCvs());
        var status = client.get().uri(base + "/scoring-status").retrieve().body(ATS.dto.ScoringStatusResponse.class);
        assertEquals(3, status.currentCvs()); assertEquals(2, status.passedCvs()); assertEquals(1, status.hardFailedCvs());
        var ranking = client.get().uri(base + "/ranking?page=0&size=1").retrieve().body(ATS.dto.PageResponse.class);
        assertEquals(3L, ranking.getTotalElements()); assertEquals(3, ranking.getTotalPages());
        var csv = client.get().uri(base + "/ranking/export?size=1&minScore=0.8").retrieve().toEntity(String.class);
        assertTrue(csv.getHeaders().getFirst("Content-Disposition").contains(".csv"));
        assertTrue(csv.getBody().contains("Complete")); assertFalse(csv.getBody().contains("Nguyễn Partial"));
        assertEquals(4, client.get().uri(base + "/ranking/export?size=1").retrieve().body(String.class).lines().count());
        var first = (Map<?, ?>) ranking.getContent().get(0);
        assertEquals(complete.getCvId().longValue(), ((Number) first.get("cvId")).longValue());
        var second = client.get().uri(base + "/ranking?page=1&size=1").retrieve().body(ATS.dto.PageResponse.class);
        assertEquals(2, ((Map<?, ?>) second.getContent().get(0)).get("rank"));
        var ascending = client.get().uri(base + "/ranking?sortOrder=ASC").retrieve().body(ATS.dto.PageResponse.class);
        // Lọc cứng được ưu tiên, dù nhóm không đạt có điểm nhỏ nhất khi sắp tăng dần.
        assertEquals(partial.getCvId().longValue(), ((Number) ((Map<?, ?>) ascending.getContent().get(0)).get("cvId")).longValue());
        assertEquals(1L, client.get().uri(base + "/ranking?minScore=0.8&maxScore=1").retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
        assertEquals(1L, client.get().uri(base + "/ranking?query=nguyen&passedHardFilter=true").retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
        var failOnly = client.get().uri(base + "/ranking?passedHardFilter=false").retrieve().body(ATS.dto.PageResponse.class);
        assertEquals(failed.getCvId().longValue(), ((Number) ((Map<?, ?>) failOnly.getContent().get(0)).get("cvId")).longValue());
        assertEquals(400, client.get().uri(base + "/ranking?minScore=80").<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        var detail = client.get().uri("/api/v1/cvs/" + partial.getCvId() + "/match").retrieve().body(ATS.dto.MatchDetailResponse.class);
        assertEquals(0.75, detail.getSkillScore()); assertEquals(1, detail.getWeights().skill());
        assertEquals(2, detail.getSkillBreakdown().size());
        client.put().uri(base + "/scoring-config").body(Map.of("jaccardWeight", 0.5, "cosineWeight", 0.3, "educationWeight", 0.2)).retrieve().toBodilessEntity();
        assertEquals(3, client.get().uri(base + "/scoring-status").retrieve().body(ATS.dto.ScoringStatusResponse.class).staleCvs());
        assertEquals(0L, client.get().uri(base + "/ranking").retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
        assertEquals(409, client.get().uri("/api/v1/cvs/" + partial.getCvId() + "/match").<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        client.post().uri(base + "/rescore").retrieve().toBodilessEntity();
        assertEquals(3, client.get().uri(base + "/scoring-status").retrieve().body(ATS.dto.ScoringStatusResponse.class).currentCvs());
    }

    private RestClient queueClient() {
        var principal = org.springframework.security.core.userdetails.User
                .withUsername(owner.getEmail()).password("unused").roles("RECRUITER").build();
        String jwt = tokens.generateToken(new UsernamePasswordAuthenticationToken(principal, null));
        return RestClient.builder().baseUrl("http://127.0.0.1:" + environment.getProperty("local.server.port"))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + jwt).build();
    }

    @Test
    void dictionaryAdminWorkflowPersistsAliasesAndUnknownEntriesRequireExplicitSelection() {
        RestClient client=queueClient();
        assertEquals(403,client.post().uri("/api/v1/skills").body(Map.of("canonicalName","Forbidden","skillType","TECHNICAL"))
                .<Integer>exchange((req,res)->res.getStatusCode().value()).intValue());
        assertEquals(403,client.get().uri("/api/v1/unknown-skills").<Integer>exchange((req,res)->res.getStatusCode().value()).intValue());
        owner.setRole(Role.ADMIN);users.saveAndFlush(owner);
        String prefix="Fixture-"+UUID.randomUUID();Long categoryId=null,skillId=null;
        try {
            var category=client.post().uri("/api/v1/skill-categories").body(Map.of("categoryName",prefix))
                    .retrieve().body(ATS.dto.CategoryResponse.class);categoryId=category.getCategoryId();
            var created=client.post().uri("/api/v1/skills").body(Map.of("canonicalName",prefix,"skillType","TECHNICAL","categoryId",categoryId))
                    .retrieve().body(ATS.dto.SkillResponse.class);skillId=created.getSkillId();
            assertEquals(categoryId,created.getCategoryId());assertTrue(created.getAliases().isEmpty());
            String raw=prefix+" Alternative";
            var cv=scoringFixture("Unknown fixture",CVStatus.PARSED);
            cv.setRawNlpResult("{\"unknownSkills\":[{\"raw\":\""+raw+"\"},{\"raw\":\""+raw+"\"}]}");cvs.saveAndFlush(cv);
            var unknown=client.get().uri("/api/v1/unknown-skills?search="+prefix).retrieve().body(ATS.dto.PageResponse.class);
            assertEquals(1L,unknown.getTotalElements());
            var alias=client.post().uri("/api/v1/skills/"+skillId+"/aliases").body(Map.of("aliasText",raw))
                    .retrieve().body(ATS.dto.AliasResponse.class);
            assertEquals(0L,client.get().uri("/api/v1/unknown-skills?search="+prefix).retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
            assertTrue(nlpDictionary.snapshot().stream().anyMatch(s->s.canonical().equals(prefix)&&s.aliases().contains(raw)));
            assertEquals(409,client.post().uri("/api/v1/skills/"+skillId+"/aliases").body(Map.of("aliasText",raw.toUpperCase(Locale.ROOT)))
                    .<Integer>exchange((req,res)->res.getStatusCode().value()).intValue());
            assertEquals(409,client.delete().uri("/api/v1/skill-categories/"+categoryId)
                    .<Integer>exchange((req,res)->res.getStatusCode().value()).intValue());
            client.put().uri("/api/v1/skills/"+skillId).body(Map.of("canonicalName",prefix+" edited","skillType","SOFT","categoryId",categoryId))
                    .retrieve().toBodilessEntity();
            var list=client.get().uri("/api/v1/skills?query="+prefix).retrieve().body(ATS.dto.SkillResponse[].class);
            assertEquals(1,list.length);assertEquals(1,list[0].getAliases().size());
            client.delete().uri("/api/v1/skills/"+skillId+"/aliases/"+alias.getAliasId()).retrieve().toBodilessEntity();
            assertEquals(1L,client.get().uri("/api/v1/unknown-skills?search="+prefix).retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
            owner.setUserStatus(UserStatus.LOCKED);users.saveAndFlush(owner);
            assertEquals(401,client.get().uri("/api/v1/user/me").<Integer>exchange((req,res)->res.getStatusCode().value()).intValue());
        } finally {
            if(skillId!=null)skills.deleteById(skillId);
            if(categoryId!=null) {
                final Long fixtureCategoryId=categoryId;
                // Không còn kỹ năng trong nhóm sau khi fixture skill được xóa.
                categoryRepository.deleteById(fixtureCategoryId);
            }
        }
    }

    @Test
    void reviewRoundTripSurvivesRescoringAndAppearsInRankingAndQueue() {
        Skills skill = skills.findAll().get(0);
        JobRequiredSkill required = new JobRequiredSkill(); required.setJob(job); required.setSkill(skill);
        required.setWeight(1.0); job.getRequiredSkills().add(required);
        job.setW1(1); job = jobs.saveAndFlush(job);
        Long id = scoringFixture("Review candidate", CVStatus.PARSED, skill).getCvId();
        RestClient client = queueClient(); String path = "/api/v1/cvs/" + id + "/review";
        var initial = client.get().uri(path).retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(HrReviewStatus.PENDING, initial.reviewStatus()); assertEquals(0, initial.version());
        assertTrue(initial.canReview()); assertTrue(initial.canEdit()); assertEquals("", initial.note());
        String note = "Ứng viên phù hợp. Cần hỏi thêm lịch nhận việc.\n<script>plain text</script>";
        var saved = client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.SHORTLISTED, note, 0L))
                .retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(1, saved.version()); assertNotNull(saved.reviewedAt());
        var same = client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.SHORTLISTED, note, 1L))
                .retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(1, same.version());
        assertEquals(409, client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.REJECTED, "stale", 0L))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        var edited = client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.SHORTLISTED, note + " ✓", 1L))
                .retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(saved.reviewedAt(), edited.reviewedAt()); assertEquals(2, edited.version());
        client.post().uri("/api/v1/jobs/" + job.getJobId() + "/rescore").retrieve().toBodilessEntity();
        var read = client.get().uri(path).retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(edited, read);
        assertEquals(CVStatus.SCORED, transactions.getStatus(id, owner.getId()).getStatus());
        var filtered = client.get().uri("/api/v1/jobs/" + job.getJobId() + "/ranking?reviewStatus=SHORTLISTED")
                .retrieve().body(ATS.dto.PageResponse.class);
        assertEquals(1L, filtered.getTotalElements());
        assertEquals("SHORTLISTED", ((Map<?, ?>) filtered.getContent().get(0)).get("reviewStatus"));
        assertEquals(0L, client.get().uri("/api/v1/jobs/" + job.getJobId() + "/ranking?reviewStatus=REJECTED")
                .retrieve().body(ATS.dto.PageResponse.class).getTotalElements());
        var queue = client.get().uri("/api/v1/cvs?jobId=" + job.getJobId()).retrieve().body(ATS.dto.CvQueueResponse.class);
        assertEquals(HrReviewStatus.SHORTLISTED, queue.items().get(0).reviewStatus());
        var reset = client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.PENDING, note, 2L))
                .retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(3, reset.version()); assertNull(reset.reviewedAt()); assertEquals(note, reset.note());
    }

    @Test
    void reviewValidatesInputAndProcessingStateAndClosedJobIsReadOnly() {
        Long id = scoringFixture("Processing review", CVStatus.PARSING).getCvId();
        RestClient client = queueClient(); String path = "/api/v1/cvs/" + id + "/review";
        var initial = client.get().uri(path).retrieve().body(ATS.dto.CvReviewResponse.class);
        assertFalse(initial.canReview()); assertTrue(initial.canEdit());
        assertEquals(409, client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.SHORTLISTED, "", 0L))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(400, client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.PENDING, "x".repeat(5001), 0L))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(400, client.put().uri(path).body(Map.of("reviewStatus", "INVALID", "note", "", "expectedVersion", 0))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(400, client.put().uri(path).body(Map.of("reviewStatus", "PENDING", "note", ""))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        var saved = client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.PENDING, "Ghi chú trước", 0L))
                .retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(1, saved.version());
        // Đóng qua API thật; hồ sơ và ghi chú được giữ lại.
        client.delete().uri("/api/v1/jobs/" + job.getJobId()).retrieve().toBodilessEntity();
        var read = client.get().uri(path).retrieve().body(ATS.dto.CvReviewResponse.class);
        assertFalse(read.canEdit()); assertFalse(read.canReview()); assertEquals("Ghi chú trước", read.note());
        assertEquals(409, client.put().uri(path).body(new ATS.dto.CvReviewRequest(HrReviewStatus.PENDING, "overwrite", 1L))
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(404, client.get().uri("/api/v1/cvs/" + Long.MAX_VALUE + "/review")
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(401, RestClient.create("http://127.0.0.1:" + environment.getProperty("local.server.port"))
                .get().uri(path).<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
    }

    @Test @Timeout(30)
    void simultaneousReviewSavesAllowOnlyOneWriterForTheSameVersion() throws Exception {
        Long id = scoringFixture("Concurrent review", CVStatus.PARSED).getCvId();
        var start = new java.util.concurrent.CountDownLatch(1);
        java.util.function.Function<String, Integer> save = note -> {
            try { start.await(); } catch (InterruptedException e) { throw new RuntimeException(e); }
            return queueClient().put().uri("/api/v1/cvs/" + id + "/review")
                    .body(new ATS.dto.CvReviewRequest(HrReviewStatus.SHORTLISTED, note, 0L))
                    .exchange((req, res) -> res.getStatusCode().value());
        };
        var a = java.util.concurrent.CompletableFuture.supplyAsync(() -> save.apply("Cửa sổ A"));
        var b = java.util.concurrent.CompletableFuture.supplyAsync(() -> save.apply("Cửa sổ B"));
        start.countDown();
        assertEquals(Set.of(200, 409), Set.of(a.get(), b.get()));
        var read = queueClient().get().uri("/api/v1/cvs/" + id + "/review").retrieve().body(ATS.dto.CvReviewResponse.class);
        assertEquals(1, read.version()); assertTrue(Set.of("Cửa sổ A", "Cửa sổ B").contains(read.note()));
    }

    @Test @Timeout(30)
    void queueDetailDownloadAndDeletionUseOwnedPersistedData() throws Exception {
        var good = uploads.uploadCvs(job.getJobId(), List.of(validPdf()), owner.getId()).get(0);
        Long id = good.getCvId();
        await(() -> transactions.getStatus(id, owner.getId()).getStatus() == CVStatus.PARSED);
        RestClient client = queueClient();
        String path = "/api/v1/cvs/" + id;
        var queue = client.get().uri("/api/v1/cvs?jobId=" + job.getJobId()).retrieve().body(ATS.dto.CvQueueResponse.class);
        assertEquals(1, queue.totalElements());
        assertEquals(1, queue.statusCounts().get("PARSED"));
        assertEquals("valid.pdf", queue.items().get(0).filename());
        assertTrue(queue.items().get(0).textExtracted());
        var detail = client.get().uri(path).retrieve().body(ATS.dto.CvExtractionDetail.class);
        assertEquals(id, detail.cv().cvId());
        assertEquals(CVStatus.PARSED, detail.cv().status());
        byte[] downloaded = client.get().uri(path + "/file").retrieve().body(byte[].class);
        assertArrayEquals(objects.get(good.getFilePath()), downloaded);
        assertEquals(401, RestClient.create("http://127.0.0.1:" + environment.getProperty("local.server.port"))
                .get().uri(path + "/file").<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(404, client.get().uri("/api/v1/cvs?jobId=" + Long.MAX_VALUE)
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(400, client.get().uri("/api/v1/cvs?jobId=" + job.getJobId() + "&size=101")
                .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertEquals(0, client.get().uri("/api/v1/cvs?jobId=" + job.getJobId() + "&status=PARSED_FAILED")
                .retrieve().body(ATS.dto.CvQueueResponse.class).totalElements());
        assertEquals(204, client.delete().uri(path).retrieve().toBodilessEntity().getStatusCode().value());
        assertFalse(cvs.existsById(id));
        assertFalse(objects.containsKey(good.getFilePath()));
        assertFalse(pending.existsById(good.getFilePath()));
    }

    @Test
    void deleteKeepsCleanupTicketWhenMinioFailsAndRejectsActiveProcessing() {
        CVs cv = new CVs(); cv.setJob(job); cv.setFilePath("test/" + UUID.randomUUID() + ".pdf");
        paths.add(cv.getFilePath());
        cv.setStatus(CVStatus.PARSING); cvs.saveAndFlush(cv);
        RestClient client = queueClient(); String path = "/api/v1/cvs/" + cv.getCvId();
        assertEquals(409, client.delete().uri(path).<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
        assertTrue(cvs.existsById(cv.getCvId()));
        cv.setStatus(CVStatus.PARSED_FAILED); cvs.saveAndFlush(cv);
        doThrow(new IllegalStateException("MinIO unavailable")).when(storage).deleteFile(cv.getFilePath());
        assertEquals(204, client.delete().uri(path).retrieve().toBodilessEntity().getStatusCode().value());
        assertFalse(cvs.existsById(cv.getCvId()));
        assertTrue(pending.existsById(cv.getFilePath()));
        doNothing().when(storage).deleteFile(cv.getFilePath());
        cleanup.delete(cv.getFilePath(), true);
        assertFalse(pending.existsById(cv.getFilePath()));
    }

    @Test
    void queueAndFileRejectAnotherOwnerAndClosedJobRejectsNewUploads() throws Exception {
        User another = new User(); another.setEmail("queue-owner-" + UUID.randomUUID() + "@example.invalid");
        another.setPasswordHash("fixture"); another.setRole(Role.RECRUITER); another.setUserStatus(UserStatus.ACTIVE);
        another = users.saveAndFlush(another);
        try {
            CVs cv = new CVs(); cv.setJob(job); cv.setFilePath("test/owner.pdf"); cv.setStatus(CVStatus.PARSED_FAILED);
            cv = cvs.saveAndFlush(cv);
            var principal = org.springframework.security.core.userdetails.User.withUsername(another.getEmail()).password("unused").roles("RECRUITER").build();
            String jwt = tokens.generateToken(new UsernamePasswordAuthenticationToken(principal, null));
            RestClient other = RestClient.builder().baseUrl("http://127.0.0.1:" + environment.getProperty("local.server.port"))
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + jwt).build();
            for (String suffix : List.of("", "/status", "/file", "/review")) {
                assertEquals(404, other.get().uri("/api/v1/cvs/" + cv.getCvId() + suffix)
                        .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
            }
            assertEquals(404, other.put().uri("/api/v1/cvs/" + cv.getCvId() + "/review")
                    .body(new ATS.dto.CvReviewRequest(HrReviewStatus.PENDING, "", 0L))
                    .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
            assertEquals(404, other.get().uri("/api/v1/cvs?jobId=" + job.getJobId())
                    .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
            assertEquals(404, other.delete().uri("/api/v1/cvs/" + cv.getCvId())
                    .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
            assertEquals(404, other.post().uri("/api/v1/cvs/" + cv.getCvId() + "/retry")
                    .<Integer>exchange((req, res) -> res.getStatusCode().value()).intValue());
            job.setStatus(JobStatus.CLOSED); jobs.saveAndFlush(job);
            assertEquals(409, assertThrows(org.springframework.web.server.ResponseStatusException.class,
                    () -> uploads.uploadCvs(job.getJobId(), List.of(validPdf()), owner.getId())).getStatusCode().value());
        } finally { users.deleteById(another.getId()); }
    }

    private void await(java.util.function.BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + java.time.Duration.ofSeconds(10).toNanos();
        while (!condition.getAsBoolean() && System.nanoTime() < deadline) {
            Thread.sleep(25);
        }
        assertTrue(condition.getAsBoolean(), "Background PDF task did not finish");
    }
}
