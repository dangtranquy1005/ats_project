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
    
    @Column(nullable = false)
    private String institution;
    
    @Column(nullable = false)
    private String degree;
    
    private String fieldOfStudy;


    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String grade;
}
