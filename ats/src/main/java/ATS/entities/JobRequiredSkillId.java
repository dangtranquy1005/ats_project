package ATS.entities;

import lombok.Data;

import java.io.Serializable;

@Data
public class JobRequiredSkillId implements Serializable {
    private Long job;
    private Long skill;
}
