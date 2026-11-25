package ATS.service;

import ATS.dto.CvUploadResult;
import ATS.entities.*;
import ATS.enums.*;
import ATS.repository.*;
import ATS.dto.CvStatusResponse;
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
 * Tạo/xóa fixture riêng. MinIO dùng mock để chủ động gây lỗi trong khi transaction dùng PostgreSQL thật.
 */
@EnabledIfEnvironmentVariable(named = "ATS_RUN_DB_TESTS", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.show-sql=false",
        "spring.docker.compose.enabled=false", "ats.skills.seed.enabled=false",
        "cv.pdf.poll-ms=3600000", "cv.cleanup.poll-ms=3600000"
})
class CvUploadIntegrationTests {
    @MockitoBean FileStorageService storage;
    @Autowired CvUploadService uploads;
    @Autowired CvUploadTransactions transactions;
    @Autowired CvPdfWorker pdfWorker;
    @Autowired UploadCleanupWorker cleanup;
    @Autowired PendingUploadCleanupRepository pending;
    @Autowired CVRepository cvs;
    @Autowired JobRepository jobs;
    @Autowired UserRepository users;
    @Autowired Environment environment;
    @Autowired TokenProvider tokens;
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
        assertEquals(CVStatus.PENDING, transactions.getStatus(good, owner.getId()).getStatus());
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
        int unauthenticated = RestClient.create(base).get().uri("/api/v1/cvs/" + id + "/status")
                .exchange((request, reply) -> reply.getStatusCode().value());
        assertEquals(401, unauthenticated);
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

    private void await(java.util.function.BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + java.time.Duration.ofSeconds(10).toNanos();
        while (!condition.getAsBoolean() && System.nanoTime() < deadline) {
            Thread.sleep(25);
        }
        assertTrue(condition.getAsBoolean(), "Background PDF task did not finish");
    }
}
