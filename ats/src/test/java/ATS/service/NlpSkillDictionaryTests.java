package ATS.service;

import ATS.entities.*;
import ATS.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NlpSkillDictionaryTests {
    @Test
    void databaseDictionaryIncludesStableIdCanonicalNameAliasesAndCategory() {
        SkillRepository repository = mock(SkillRepository.class);
        Skills skill = new Skills();
        skill.setSkillId(42L);
        skill.setCanonicalName("React");
        SkillCategory category = new SkillCategory();
        category.setName("Frontend");
        skill.setCategory(category);
        SkillAlias alias = new SkillAlias();
        alias.setAliasText("React.js");
        skill.getAliases().add(alias);
        when(repository.findDictionaryWithAliases()).thenReturn(List.of(skill));
        var entry = new NlpSkillDictionary(repository).snapshot().get(0);
        assertEquals(42L, entry.id());
        assertEquals("React", entry.canonical());
        assertEquals(List.of("React.js"), entry.aliases());
        assertEquals("Frontend", entry.category());
    }
}
