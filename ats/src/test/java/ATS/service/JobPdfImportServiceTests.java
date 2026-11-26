package ATS.service;

import ATS.dto.AnalyzeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestClient;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class JobPdfImportServiceTests {
    PdfTextExtractor pdf; NlpSkillDictionary dictionary; MockRestServiceServer server; JobPdfImportService service;
    MockMultipartFile file=new MockMultipartFile("file","job.pdf","application/pdf",new byte[]{1,2,3});
    @BeforeEach void setup(){
        pdf=mock(PdfTextExtractor.class);dictionary=mock(NlpSkillDictionary.class);
        when(pdf.extractText(file)).thenReturn("Job title: Java Developer\nRequired Java skills. At least two years experience.");
        when(dictionary.snapshot()).thenReturn(List.of(new AnalyzeRequest.DictionarySkill(12L,"Java",List.of(),"Programming")));
        var builder=RestClient.builder().baseUrl("http://nlp.test");server=MockRestServiceServer.bindTo(builder).build();
        service=new JobPdfImportService(pdf,dictionary,builder.build());
    }
    @Test void returnsEditableDraftWithTrustedIdsAndEqualWeights(){
        server.expect(requestTo("http://nlp.test/nlp/extract-job")).andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"title\":\"Java Developer\",\"minExperienceYears\":2,\"educationRequirements\":\"UNIVERSITY\",\"requiredSkills\":[{\"skillId\":12,\"skillName\":\"wrong name\",\"mandatory\":true,\"weight\":999,\"sourceText\":\"Required Java\"}],\"warnings\":[]}",MediaType.APPLICATION_JSON));
        var draft=service.analyze(file);
        assertEquals("Java",draft.requiredSkills().get(0).skillName());
        assertEquals(1.0,draft.requiredSkills().get(0).weight());
        assertTrue(draft.description().contains("Required Java"));server.verify();
    }
    @Test void rejectsUnknownDictionaryId(){
        server.expect(requestTo("http://nlp.test/nlp/extract-job")).andRespond(withSuccess("{\"requiredSkills\":[{\"skillId\":999,\"mandatory\":true}],\"warnings\":[]}",MediaType.APPLICATION_JSON));
        assertEquals(502,assertThrows(ResponseStatusException.class,()->service.analyze(file)).getStatusCode().value());
    }
    @Test void imageOnlyAndUnreadableFilesDoNotCallNlp(){
        when(pdf.extractText(file)).thenReturn("");
        assertEquals(422,assertThrows(ResponseStatusException.class,()->service.analyze(file)).getStatusCode().value());
        when(pdf.extractText(file)).thenThrow(new PdfTextExtractor.PdfExtractionException("PDF hỏng"));
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.analyze(file)).getStatusCode().value());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.analyze(new MockMultipartFile("file",new byte[]{}))).getStatusCode().value());
        verifyNoInteractions(dictionary);server.verify();
    }
    @Test void unavailableNlpHasFriendlyError(){
        server.expect(requestTo("http://nlp.test/nlp/extract-job")).andRespond(withServerError());
        assertEquals(502,assertThrows(ResponseStatusException.class,()->service.analyze(file)).getStatusCode().value());
    }
}
