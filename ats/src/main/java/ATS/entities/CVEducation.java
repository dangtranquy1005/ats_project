package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "tbl_cv_education")
public class CVEducation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "cv_id", nullable = false)
    private CVs cv;
    
    // Thông tin chưa trích xuất được để NULL, vẫn giữ sourceText để đối chiếu.
    @Column
    private String institution;
    
    @Column
    private String degree;
    
    private String fieldOfStudy;

    // Năm tốt nghiệp tách riêng vì NLP không xác định được ngày tốt nghiệp cụ thể.
    private Integer graduationYear;

    @Column(columnDefinition = "TEXT")
    private String sourceText;


    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String grade;
}
