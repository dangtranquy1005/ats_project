package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import ATS.enums.DatePrecision;

@Entity
@Data
@Table(name = "tbl_cv_experience")
public class CVExperience {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "cv_id", nullable = false)
    private CVs cv;
    
    // Giữ mục kinh nghiệm và sourceText ngay cả khi NLP chưa xác định tên công ty/chức danh.
    @Column
    private String companyName;
    
    @Column
    private String jobTitle;
    
    private LocalDate startDate;
    
    private LocalDate endDate;

    // Ngày NLP trả về có thể chỉ đại diện cho tháng hoặc năm được ghi trong CV.
    @Enumerated(EnumType.STRING)
    private DatePrecision startDatePrecision;

    @Enumerated(EnumType.STRING)
    private DatePrecision endDatePrecision;

    @Column(columnDefinition = "TEXT")
    private String sourceText;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Boolean current = false;
}
