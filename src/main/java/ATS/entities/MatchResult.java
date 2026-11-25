package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "tbl_match_result")
public class MatchResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long matchResultId;
    
    @OneToOne
    @JoinColumn(name = "cv_id", nullable = false, unique = true)
    private CVs cv;
    
    @Column(nullable = false)
    private Double jaccardScore;
    
    @Column(nullable = false)
    private Double cosineScore;
    
    @Column(nullable = false)
    private Double educationScore;
    
    @Column(nullable = false)
    private Double overallScore;

    private boolean passedHardFilter;

    @Column(nullable = false, updatable = false)
    private LocalDateTime calculatedAt = LocalDateTime.now();
}
