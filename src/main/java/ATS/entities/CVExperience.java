package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

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
    
    @Column(nullable = false)
    private String companyName;
    
    @Column(nullable = false)
    private String jobTitle;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Boolean current = false;
}
