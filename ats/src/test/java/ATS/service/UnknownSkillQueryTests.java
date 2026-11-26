package ATS.service;

import ATS.entities.*;
import ATS.repository.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UnknownSkillQueryTests {
    @Test void aggregatesOncePerCvSkipsKnownNamesAndMalformedSnapshots() {
        var cvs=mock(CVRepository.class); var skills=mock(SkillRepository.class);
        Skills java=new Skills(); java.setCanonicalName("Java");
        SkillAlias alias=new SkillAlias(); alias.setAliasText("JDK"); java.getAliases().add(alias);
        when(skills.findDictionaryWithAliases()).thenReturn(List.of(java));
        when(cvs.findCompletedNlpSnapshots()).thenReturn(List.of(
            "{\"unknownSkills\":[{\"raw\":\"Qz Framework\"},{\"raw\":\"QZ  Framework\"},{\"raw\":\"Ｊａｖａ\"},{\"raw\":\"jdk\"}]}",
            "{\"unknownSkills\":[{\"raw\":\"Qz Framework\"},{\"raw\":\"Other\"}]}", "not-json", "{}"));
        var query=new UnknownSkillQuery(cvs,skills,JsonMapper.builder().build());
        var result=query.list(0,1,"");
        assertEquals(2,result.getTotalElements()); assertEquals(2,result.getTotalPages());
        assertEquals(2,result.getContent().get(0).cvCount());
        assertEquals("Qz Framework",result.getContent().get(0).name());
        assertEquals(1,query.list(0,25,"other").getTotalElements());
        assertThrows(org.springframework.web.server.ResponseStatusException.class,()->query.list(0,101,""));
    }
}
