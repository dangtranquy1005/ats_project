package ATS.entities;

import ATS.enums.MatchMethod;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "tbl_cv_skills")
public class CVSkills {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "cv_id", nullable = false)
    private CVs cv;
    
    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skills skill;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchMethod matchMethod;

}
