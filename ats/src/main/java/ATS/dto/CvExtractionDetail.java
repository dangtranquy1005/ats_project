package ATS.dto;

import ATS.enums.DatePrecision;
import ATS.enums.MatchMethod;
import java.time.LocalDate;
import java.util.List;

/** Chỉ đọc dữ liệu đã lưu, không suy đoán trường NLP còn thiếu. */
public record CvExtractionDetail(CvQueueItem cv, String phone, List<Skill> skills,
                                  List<Experience> experiences, List<Education> educations) {
    public record Skill(Long skillId, String canonicalName, MatchMethod matchMethod) {}
    public record Experience(String companyName, String jobTitle, LocalDate startDate, LocalDate endDate,
                             DatePrecision startDatePrecision, DatePrecision endDatePrecision,
                             Boolean current, String description, String sourceText) {}
    public record Education(String institution, String degree, String fieldOfStudy,
                            Integer graduationYear, String sourceText) {}
}
