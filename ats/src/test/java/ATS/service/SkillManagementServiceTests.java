package ATS.service;

import ATS.dto.SkillRequest;
import ATS.entities.JobRequiredSkill;
import ATS.entities.SkillAlias;
import ATS.entities.Skills;
import ATS.enums.SkillType;
import ATS.repository.SkillAliasRepository;
import ATS.repository.SkillCategoryRepository;
import ATS.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SkillManagementServiceTests {
    private SkillRepository skills;
    private SkillAliasRepository aliases;
    private SkillManagementService service;
    private Skills react;

    @BeforeEach
    void setUp() {
        skills = mock(SkillRepository.class);
        aliases = mock(SkillAliasRepository.class);
        service = new SkillManagementService(skills, mock(SkillCategoryRepository.class),
                aliases, mock(JdbcTemplate.class));
        react = new Skills();
        react.setSkillId(1L);
        react.setCanonicalName("React");
        react.setType(SkillType.TECHNICAL);
        when(skills.findById(1L)).thenReturn(Optional.of(react));
        when(skills.findAll()).thenReturn(List.of(react));
    }

    @Test
    void aliasSearchReturnsCanonicalSkill() {
        SkillAlias alias = new SkillAlias();
        alias.setAliasText("React.js");
        alias.setSkill(react);
        react.getAliases().add(alias);
        assertEquals(1L, service.search("  REACT.JS ").get(0).getSkillId());
    }

    @Test
    void unicodeEquivalentNamesAndExistingAliasesAreRejected() {
        SkillRequest request = new SkillRequest("Ｒｅａｃｔ", null, SkillType.TECHNICAL, null);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.create(request)).getStatusCode());
        SkillAlias alias = new SkillAlias();
        alias.setAliasText("React.js");
        alias.setSkill(react);
        when(aliases.findAllWithSkills()).thenReturn(List.of(alias));
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.addAlias(1L, " REACT.JS ")).getStatusCode());
        verify(skills, never()).save(any());
        verify(aliases, never()).save(any());
    }

    @Test
    void deletingSkillInUsePreservesJobAssociations() {
        react.getJobRequiredSkills().add(new JobRequiredSkill());
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.delete(1L)).getStatusCode());
        verify(skills, never()).delete(any());
    }

    @Test void aliasCountStaysWithinNlpRequestLimit() {
        for (int i=0;i<64;i++) react.getAliases().add(new SkillAlias());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> service.addAlias(1L, "another variant")).getStatusCode());
        verify(aliases, never()).save(any());
    }
}
