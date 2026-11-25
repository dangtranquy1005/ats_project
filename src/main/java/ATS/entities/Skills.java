package ATS.entities;

import ATS.enums.SkillType;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "tbl_skills")
public class Skills {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long skillId;
    
    @Column(nullable = false, unique = true)
    private String canonicalName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillType type;



    @ManyToOne
    @JoinColumn(name = "category_id")
    private SkillCategory category;
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillAlias> aliases = new ArrayList<>();
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JobRequiredSkill> jobRequiredSkills = new ArrayList<>();
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CVSkills> cvSkills = new ArrayList<>();
}
