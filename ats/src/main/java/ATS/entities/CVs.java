package ATS.entities;

import ATS.enums.CVStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "tbl_cv")
public class CVs {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cvId;
    
    @ManyToOne
    @JoinColumn(name = "job_desc_id", nullable = false)
    private Job job;
    
    // Thông tin trích xuất có thể thiếu trong CV. NULL biểu thị chưa xác định được.
    @Column
    private String candidateName;
    
    @Column
    private String email;
    
    private String phone;
    
    @Column(nullable = false)
    private String filePath;
    private String originalFilename;
    private LocalDateTime updatedAt = LocalDateTime.now();
    private String pdfProcessingToken;
    private LocalDateTime pdfProcessingStartedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CVStatus status = CVStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rawText;
    @Column(columnDefinition = "TEXT")
    private String rawNlpResult;

    private String errorMessage;
    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
    
    @OneToOne(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private MatchResult matchResult;
    
    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CVSkills> cvSkills = new ArrayList<>();
    
    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CVEducation> educations = new ArrayList<>();
    
    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CVExperience> experiences = new ArrayList<>();

    @PreUpdate
    private void markUpdated() {
        updatedAt = LocalDateTime.now();
    }
}
