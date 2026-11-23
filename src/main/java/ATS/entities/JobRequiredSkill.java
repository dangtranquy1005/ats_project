package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "tbl_job_required_skill")
@IdClass(JobRequiredSkillId.class)
public class JobRequiredSkill {
    
    @Id
    @ManyToOne
    @JoinColumn(name = "job_posting_id", nullable = false)
    private Job job;
    
    @Id
    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skills skill;
    
    private boolean isMandatory;
    private Double weight = 1.0;
}

