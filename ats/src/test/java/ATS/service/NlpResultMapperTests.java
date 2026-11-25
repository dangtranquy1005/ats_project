package ATS.service;

import ATS.dto.AnalyzeResponse;
import ATS.entities.CVEducation;
import ATS.entities.CVExperience;
import ATS.entities.CVs;
import ATS.enums.DatePrecision;
import ATS.enums.MatchMethod;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class NlpResultMapperTests {
    private final JsonMapper json = JsonMapper.builder().build();
    private final NlpResultMapper mapper = new NlpResultMapper();

    @Test
    void pythonFieldsDeserializeAndMapWithoutInventingEducationDates() {
        AnalyzeResponse response = json.readValue("""
                {
                  "cvId": 10,
                  "person": {"name": "Nguyễn Văn An", "email": null, "phone": null, "links": []},
                  "skills": [{"skillId": 1, "canonical": "Spring Boot", "matchMethod": "ALIAS"}],
                  "experiences": [{
                    "companyName": "ABC", "jobTitle": "Developer",
                    "startDate": "2022-01-01", "endDate": null,
                    "startDatePrecision": "year", "endDatePrecision": null,
                    "isCurrent": true, "description": "Java", "sourceText": "2022 - Hiện tại"
                  }],
                  "educations": [{
                    "institution": "Đại học X", "degree": "Engineer",
                    "field": "Công nghệ thông tin", "graduationYear": 2021, "sourceText": "Tốt nghiệp 2021"
                  }],
                  "unknownSkills": [{"raw": "PostgreSQlX", "suggestions": [
                    {"canonical": "PostgreSQL", "skillId": 2, "similarity": 0.95}
                  ]}],
                  "warnings": ["Example warning"], "rawTokens": ["Java"], "entities": [],
                  "modelVersion": "ats-nlp-1.0/full", "experienceText": "Java"
                }
                """, AnalyzeResponse.class);
        CVs cv = new CVs();
        CVExperience experience = mapper.toExperience(response.getExperiences().get(0), cv);
        assertSame(cv, experience.getCv());
        assertEquals(LocalDate.of(2022, 1, 1), experience.getStartDate());
        assertEquals(DatePrecision.YEAR, experience.getStartDatePrecision());
        assertNull(experience.getEndDatePrecision());
        assertNull(experience.getEndDate());
        assertTrue(experience.getCurrent());
        assertEquals("2022 - Hiện tại", experience.getSourceText());
        CVEducation education = mapper.toEducation(response.getEducations().get(0), cv);
        assertSame(cv, education.getCv());
        assertEquals("Công nghệ thông tin", education.getFieldOfStudy());
        assertEquals(2021, education.getGraduationYear());
        assertNull(education.getStartDate());
        assertNull(education.getEndDate());
        assertEquals(MatchMethod.ALIAS, response.getSkills().get(0).matchMethod());
        assertEquals(2L, response.getUnknownSkills().get(0).suggestions().get(0).skillId());
    }

    @Test
    void monthPrecisionAndFalseCurrentSurviveJsonRoundTrip() {
        AnalyzeResponse.Experience source = json.readValue("""
                {"startDate": "2020-05-01", "endDate": "2022-06-01",
                 "startDatePrecision": "month", "endDatePrecision": "month",
                 "isCurrent": false, "sourceText": "05/2020 - 06/2022"}
                """, AnalyzeResponse.Experience.class);
        CVExperience target = mapper.toExperience(source, new CVs());
        assertEquals(DatePrecision.MONTH, target.getStartDatePrecision());
        assertEquals(DatePrecision.MONTH, target.getEndDatePrecision());
        assertFalse(target.getCurrent());
        String serialized = json.writeValueAsString(source);
        assertTrue(serialized.contains("\"isCurrent\":false"));
        assertEquals(source, json.readValue(serialized, AnalyzeResponse.Experience.class));
    }

    @Test
    void blankExtractedInformationBecomesNullWhileSourceIsPreserved() {
        AnalyzeResponse response = json.readValue("""
                {
                  "experiences": [{"companyName": "  ", "jobTitle": "",
                    "description": "Java", "sourceText": "Nguồn kinh nghiệm"}],
                  "educations": [{"institution": "", "degree": "  ", "field": " ",
                    "sourceText": "Nguồn học vấn"}]
                }
                """, AnalyzeResponse.class);
        CVExperience experience = mapper.toExperience(response.getExperiences().get(0), new CVs());
        CVEducation education = mapper.toEducation(response.getEducations().get(0), new CVs());
        assertNull(experience.getCompanyName());
        assertNull(experience.getJobTitle());
        assertEquals("Nguồn kinh nghiệm", experience.getSourceText());
        assertNull(education.getInstitution());
        assertNull(education.getDegree());
        assertNull(education.getFieldOfStudy());
        assertEquals("Nguồn học vấn", education.getSourceText());
    }

    @Test
    void missingExtractedValuesStayUnknownAndInvalidPrecisionIsRejected() {
        AnalyzeResponse.Education source = json.readValue("{}", AnalyzeResponse.Education.class);
        CVEducation target = mapper.toEducation(source, new CVs());
        assertNull(target.getGraduationYear());
        assertNull(target.getFieldOfStudy());
        assertNull(target.getDegree());
        assertThrows(RuntimeException.class, () -> json.readValue(
                "{\"startDatePrecision\":\"day\"}", AnalyzeResponse.Experience.class));
    }
}
