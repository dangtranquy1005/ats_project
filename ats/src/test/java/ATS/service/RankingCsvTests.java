package ATS.service;

import ATS.dto.RankingItem;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class RankingCsvTests {
    @Test void exportsUnicodeEscapesQuotesAndPreventsSpreadsheetFormulas() {
        var row=new RankingItem(1L,2L,0.75,0.5,1.0,0.0,"=HYPERLINK(\"x\")","Nguyễn, An@example.invalid",1);
        row.setPassedHardFilter(true);
        String csv=RankingCsv.write(List.of(row));
        assertTrue(csv.startsWith("\uFEFF")); assertTrue(csv.contains("\"'=HYPERLINK(\"\"x\"\")\""));
        assertTrue(csv.contains("\"Nguyễn, An@example.invalid\"")); assertTrue(csv.endsWith("50.0,100.0,0.0,75.0\r\n"));
        row.setCandidateName("  =1+1");
        assertTrue(RankingCsv.write(List.of(row)).contains("\"'  =1+1\""));
    }
}
