package ATS.service;

import ATS.dto.AnalyzeResponse;
import ATS.entities.CVEducation;
import ATS.entities.CVExperience;
import ATS.entities.CVs;
import org.springframework.stereotype.Component;

/**
 * Chuyển dữ liệu có kiểu từ FastAPI sang entity Java.
 * Lớp triển khai saveResult() sẽ gọi mapper rồi ghi các entity trong cùng transaction.
 */
@Component
public class NlpResultMapper {
    public CVExperience toExperience(AnalyzeResponse.Experience source, CVs cv) {
        CVExperience target = new CVExperience();
        target.setCv(cv);
        target.setCompanyName(optionalText(source.companyName()));
        target.setJobTitle(optionalText(source.jobTitle()));
        target.setStartDate(source.startDate());
        target.setEndDate(source.endDate());
        target.setStartDatePrecision(source.startDatePrecision());
        target.setEndDatePrecision(source.endDatePrecision());
        target.setCurrent(source.current());
        target.setDescription(source.description());
        target.setSourceText(source.sourceText());
        return target;
    }

    public CVEducation toEducation(AnalyzeResponse.Education source, CVs cv) {
        CVEducation target = new CVEducation();
        target.setCv(cv);
        target.setInstitution(optionalText(source.institution()));
        target.setDegree(optionalText(source.degree()));
        target.setFieldOfStudy(optionalText(source.field()));
        target.setGraduationYear(source.graduationYear());
        target.setSourceText(source.sourceText());
        return target;
    }

    // Cùng một cách biểu diễn dữ liệu thiếu, áp dụng cả cho chuỗi rỗng hoặc chỉ có khoảng trắng.
    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
