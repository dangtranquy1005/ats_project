package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "tbl_skill_alias")
public class SkillAlias {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long aliasId;
    
    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skills skill;
    
    @Column(nullable = false, unique = true)
    private String aliasText;
}
