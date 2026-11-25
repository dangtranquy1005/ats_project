package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "tbl_skill_category")
public class SkillCategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private SkillCategory parent;
    
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SkillCategory> children = new ArrayList<>();
    
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Skills> skills = new ArrayList<>();
}
