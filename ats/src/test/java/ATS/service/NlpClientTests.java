package ATS.service;

import ATS.config.NlpClientProperties;
import ATS.config.NlpClientConfig;
import ATS.dto.AnalyzeRequest;
import ATS.enums.DatePrecision;
import ATS.enums.MatchMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tools.jackson.databind.json.JsonMapper;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class NlpClientTests {
    private MockRestServiceServer server;
    private NlpSkillDictionary dictionary;
    private NlpClient client;
    private final List<AnalyzeRequest.DictionarySkill> skills =
            List.of(new AnalyzeRequest.DictionarySkill(101L, "Spring Boot", List.of("SpringBoot"), "Backend"));
    private static final String RESPONSE = """
            {"cvId":10, "skills":[{"skillId":101,"canonical":"Spring Boot","raw":"SpringBoot","matchMethod":"ALIAS"}],
             "experiences":[{"startDate":"2022-01-01","startDatePrecision":"year","isCurrent":true}],
             "educations":[{"field":"Công nghệ thông tin","graduationYear":2021}],
             "warnings":[], "rawNlpResult":"{}", "modelVersion":"ats-nlp-1.0/full"}
            """;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://nlp.test");
        server = MockRestServiceServer.bindTo(builder).build();
        dictionary = mock(NlpSkillDictionary.class);
        when(dictionary.snapshot()).thenReturn(skills);
        client = new NlpClient(builder.build(), dictionary);
    }

    private AnalyzeRequest request() {
        return new AnalyzeRequest(10L, "Kỹ năng: SpringBoot", "pdf");
    }

    @Test
    void sendsUtf8TextWithDatabaseIdsAndReadsTypedResponse() {
        server.expect(requestTo("http://nlp.test/nlp/extract")).andExpect(method(HttpMethod.POST))
                .andExpect(httpRequest -> {
                    var body = new JsonMapper().readTree(((MockClientHttpRequest) httpRequest).getBodyAsString());
                    assertEquals("Kỹ năng: SpringBoot", body.get("rawText").asText());
                    assertEquals("auto", body.get("languageHint").asText());
                    assertEquals(101L, body.get("skillDictionary").get(0).get("id").asLong());
                    assertEquals("SpringBoot", body.get("skillDictionary").get(0).get("aliases").get(0).asText());
                    assertFalse(body.has("processingToken"));
                }).andRespond(withSuccess(RESPONSE, MediaType.APPLICATION_JSON));
        AnalyzeRequest request = request();
        request.setProcessingToken("generation-token");
        var result = client.analyze(request);
        assertEquals("generation-token", result.getProcessingToken());
        assertNull(request.getSkillDictionary());
        assertEquals(MatchMethod.ALIAS, result.getSkills().get(0).matchMethod());
        assertEquals(DatePrecision.YEAR, result.getExperiences().get(0).startDatePrecision());
        assertTrue(result.getExperiences().get(0).current());
        assertEquals(2021, result.getEducations().get(0).graduationYear());
        server.verify();
    }

    @Test
    void explicitEmptyDictionaryDoesNotFallBackToDatabaseOrDemoFile() {
        server.expect(requestTo("http://nlp.test/nlp/extract")).andRespond(withSuccess(
                "{\"cvId\":10,\"skills\":[],\"experiences\":[],\"educations\":[]}", MediaType.APPLICATION_JSON));
        AnalyzeRequest request = request();
        request.setSkillDictionary(List.of());
        assertTrue(client.analyze(request).getSkills().isEmpty());
        verifyNoInteractions(dictionary);
        server.verify();
    }

    @Test
    void serverAndRateLimitErrorsAreRetryableBut422IsNot() {
        for (HttpStatus status : List.of(HttpStatus.SERVICE_UNAVAILABLE, HttpStatus.TOO_MANY_REQUESTS,
                HttpStatus.UNPROCESSABLE_CONTENT)) {
            server.reset();
            server.expect(requestTo("http://nlp.test/nlp/extract"))
                    .andRespond(withStatus(status).body("private CV text"));
            NlpClientException error = assertThrows(NlpClientException.class, () -> client.analyze(request()));
            assertEquals(NlpClientException.Reason.HTTP_ERROR, error.getReason());
            assertEquals(status.value(), error.getHttpStatus());
            assertEquals(status.value() != 422, error.isRetryable());
            assertFalse(error.getMessage().contains("private CV text"));
            assertNull(error.getCause());
            server.verify();
        }
    }

    @Test
    void timeoutAndConnectionFailuresHaveDifferentReasons() {
        server.expect(requestTo("http://nlp.test/nlp/extract"))
                .andRespond(withException(new SocketTimeoutException("read timeout")));
        var timeout = assertThrows(NlpClientException.class, () -> client.analyze(request()));
        assertEquals(NlpClientException.Reason.TIMEOUT, timeout.getReason());
        assertTrue(timeout.isRetryable());
        server.verify();
        server.reset();
        server.expect(requestTo("http://nlp.test/nlp/extract"))
                .andRespond(withException(new ConnectException("refused")));
        var connection = assertThrows(NlpClientException.class, () -> client.analyze(request()));
        assertEquals(NlpClientException.Reason.CONNECTION_ERROR, connection.getReason());
        assertTrue(connection.isRetryable());
        server.verify();
    }

    @Test
    void malformedEmptyMismatchedAndIncompleteResponsesAreRejected() {
        for (String response : List.of("", "{bad json", "{}", RESPONSE.replace("\"cvId\":10", "\"cvId\":99"),
                RESPONSE.replace("\"skillId\":101", "\"skillId\":999"))) {
            server.reset();
            server.expect(requestTo("http://nlp.test/nlp/extract"))
                    .andRespond(withSuccess(response, MediaType.APPLICATION_JSON));
            var error = assertThrows(NlpClientException.class, () -> client.analyze(request()));
            assertEquals(NlpClientException.Reason.INVALID_RESPONSE, error.getReason());
            assertFalse(error.isRetryable());
            server.verify();
        }
    }

    @Test
    void invalidInputIsRejectedBeforeReadingDictionaryOrSendingHttp() {
        for (String text : new String[]{null, " ", "x".repeat(200_001)}) {
            AnalyzeRequest request = request();
            request.setRawText(text);
            assertEquals(NlpClientException.Reason.INVALID_REQUEST,
                    assertThrows(NlpClientException.class, () -> client.analyze(request)).getReason());
        }
        verifyNoInteractions(dictionary);
        server.verify();
    }

    @Test
    void clientBeansStartWithProjectConfigurationAndDefaultTimeouts() {
        new ApplicationContextRunner().withUserConfiguration(NlpClientConfig.class, NlpClient.class)
                .withBean(NlpSkillDictionary.class, () -> dictionary)
                .withPropertyValues("nlp.base-url=http://127.0.0.1:8000")
                .run(context -> {
                    assertNull(context.getStartupFailure());
                    assertNotNull(context.getBean(NlpClient.class));
                    assertNotNull(context.getBean("nlpRestClient", RestClient.class));
                    var properties = context.getBean(NlpClientProperties.class);
                    assertEquals(Duration.ofSeconds(3), properties.connectTimeout());
                    assertEquals(Duration.ofSeconds(30), properties.readTimeout());
                });
    }

    @Test
    void configurationRejectsUnboundedTimeoutsAndUnsupportedProtocols() {
        assertThrows(IllegalArgumentException.class, () -> new NlpClientProperties(
                URI.create("http://localhost:8000"), Duration.ZERO, Duration.ofSeconds(30)));
        assertThrows(IllegalArgumentException.class, () -> new NlpClientProperties(
                URI.create("file:///tmp/model"), Duration.ofSeconds(3), Duration.ofSeconds(30)));
    }
}
