package ATS.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

import static io.jsonwebtoken.lang.Strings.clean;

@Component
public class PdfTextExtractor {
    // Giới hạn số trang đ tránh làm tốn bộ nhớ - cv thì thờng từ 1 đến 2 trang
    public static final int max_page = 3;
    // Dưới ngưỡng này thì coi như không có vawn bản từ pdf
    private static final int min_chars = 70;

    private static final double MAX_GARBLED_RATIO = 0.05;
    private final boolean sortByPosition;

    public PdfTextExtractor(@Value("${cv.pdf.sort-by-position:false}") boolean sortByPosition) {
        this.sortByPosition = sortByPosition;
    }

    public String extractText(MultipartFile file) {
        try (InputStream in = file.getInputStream();
             PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(in))) {

            if (!document.getCurrentAccessPermission().canExtractContent()) {
                throw new PdfExtractionException("PDF không cho phép trích văn bản");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(sortByPosition);   // thử cả true và false trên CV mẫu, xem ghi chú
            stripper.setStartPage(1);
            stripper.setEndPage(Math.min(document.getNumberOfPages(), max_page));

            String text = clean(stripper.getText(document));
            if (text.length() < min_chars || garbledRatio(text) > MAX_GARBLED_RATIO) {
                return "";
            }
            return text;

        } catch (InvalidPasswordException e) {
            throw new PdfExtractionException("PDF được bảo vệ bằng mật khẩu", e);
        } catch (IOException e) {
            throw new PdfExtractionException("Không đọc được file PDF", e);
        }
    }
    static double garbledRatio(String text) {
        int bad = 0;
        int total = 0;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (Character.isWhitespace(c)) {
                continue;
            }
            total++;
            if (c == '\uFFFD' || (c >= '\uE000' && c <= '\uF8FF')) {
                bad++;
            }
        }
        return total == 0 ? 1.0 : (double) bad / total;
    }

    public static class PdfExtractionException extends RuntimeException {
        public PdfExtractionException(String message) {
            super(message);
        }

        public PdfExtractionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
