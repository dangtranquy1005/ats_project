package ATS.entities;

import lombok.Data;

import java.io.Serializable;

@Data
public class JobRequiredSkillId implements Serializable {
    private Long jobDescription;
    private Long skill;
}
