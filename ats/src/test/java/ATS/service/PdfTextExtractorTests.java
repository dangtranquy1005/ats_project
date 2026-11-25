package ATS.service;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import java.io.*;
import static org.junit.jupiter.api.Assertions.*;

class PdfTextExtractorTests {
    @Test
    void extractsFourthPageAndRejectsMalformedPdf() throws Exception {
        byte[] pdf;
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (int i = 1; i <= 4; i++) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    content.beginText();
                    content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    content.newLineAtOffset(40, 700);
                    content.showText("Page " + i + " Java developer experience and education.");
                    if (i == 4) {
                        content.showText(" FourthPageSkill Kubernetes");
                    }
                    content.endText();
                }
            }
            document.save(out);
            pdf = out.toByteArray();
        }
        var extractor = new PdfTextExtractor(false);
        assertTrue(extractor.extractText(new ByteArrayInputStream(pdf)).contains("FourthPageSkill"));
        assertThrows(PdfTextExtractor.PdfExtractionException.class,
                () -> extractor.extractText(new ByteArrayInputStream(new byte[]{1, 2, 3})));
    }
}
