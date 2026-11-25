package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.time.LocalDate;
import ATS.enums.DatePrecision;
import ATS.enums.MatchMethod;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalyzeResponse {
    private Long cvId;
    private String candidateName;
    private String email;
    private String phone;
    private String rawNlpResult;
    private List<Skill> skills;
    private List<Experience> experiences;
    private List<Education> educations;
    private String language;
    private Person person;
    private String experienceText;
    private List<String> rawTokens;
    private List<Entity> entities;
    private List<UnknownSkill> unknownSkills;
    private String normalizedText;
    private List<String> warnings;
    private String modelVersion;

    public record Person(String name, String email, String phone, List<String> links) {}

    public record Skill(Long skillId, String key, String raw, String canonical, String category,
                        MatchMethod matchMethod, Double confidence, Integer start, Integer end) {}

    // @JsonProperty đọc đúng khóa isCurrent của Python vào thuộc tính current của Java.
    public record Experience(String companyName, String jobTitle, LocalDate startDate, LocalDate endDate,
                             DatePrecision startDatePrecision, DatePrecision endDatePrecision,
                             @JsonProperty("isCurrent") Boolean current, String description, String sourceText) {}

    // Giữ nguyên năm tốt nghiệp, không chuyển thành một ngày/tháng được tự suy đoán.
    public record Education(String institution, String degree, String field,
                            Integer graduationYear, String sourceText) {}

    public record Entity(String text, String label, Integer start, Integer end) {}

    public record Suggestion(String canonical, Long skillId, String key, Double similarity) {}

    public record UnknownSkill(String raw, List<Suggestion> suggestions) {}
}
