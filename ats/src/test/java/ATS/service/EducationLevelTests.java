package ATS.service;

import ATS.enums.EducationLevel;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EducationLevelTests {
    @Test void vietnameseEnglishAndAbbreviationsMapToSameLevel() {
        for(String value:new String[]{"Đại học","dai hoc","Cử nhân","Ky su","Bachelor of Science","B.Sc.","B.Eng.","Engineer","UNIVERSITY"})
            assertEquals(EducationLevel.UNIVERSITY,EducationLevel.parse(value).orElseThrow(),value);
        assertEquals(EducationLevel.COLLEGE,EducationLevel.parse("Associate Degree").orElseThrow());
        assertEquals(EducationLevel.MASTER,EducationLevel.parse("Thạc sĩ").orElseThrow());
        assertEquals(EducationLevel.MASTER,EducationLevel.parse("M.Sc.").orElseThrow());
        assertEquals(EducationLevel.DOCTORATE,EducationLevel.parse("Ph.D.").orElseThrow());
        assertEquals(EducationLevel.DOCTORATE,EducationLevel.parse("Tien si").orElseThrow());
    }
    @Test void higherCompletedLevelMeetsMinimumButLowerDoesNot() {
        assertTrue(EducationLevel.MASTER.meets(EducationLevel.UNIVERSITY));
        assertTrue(EducationLevel.UNIVERSITY.meets(EducationLevel.COLLEGE));
        assertFalse(EducationLevel.COLLEGE.meets(EducationLevel.UNIVERSITY));
        assertFalse(EducationLevel.MASTER.meets(EducationLevel.DOCTORATE));
    }
    @Test void emptyUnknownAndUnfinishedEducationAreHandledExplicitly() {
        assertEquals("NONE",EducationLevel.canonicalRequirement(null));
        assertEquals("NONE",EducationLevel.canonicalRequirement("Không yêu cầu"));
        assertEquals("Công nghệ thông tin",EducationLevel.canonicalRequirement("Công nghệ thông tin"));
        assertTrue(EducationLevel.unfinished("Bachelor degree - expected 2028"));
        assertTrue(EducationLevel.unfinished("Đang học thạc sĩ"));
        assertFalse(EducationLevel.unfinished("Bachelor - Graduated 2021"));
    }
}
