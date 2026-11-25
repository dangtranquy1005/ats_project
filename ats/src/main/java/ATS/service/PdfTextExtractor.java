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

@Component
public class PdfTextExtractor {
    // Giới hạn này khớp hợp đồng text đầu vào của FastAPI.
    private static final int MAX_CHARS = 200_000;
    // Dưới ngưỡng này thì coi như không có văn bản từ pdf
    private static final int MIN_CHARS = 70;

    private static final double MAX_GARBLED_RATIO = 0.05;
    private final boolean sortByPosition;

    public PdfTextExtractor(@Value("${cv.pdf.sort-by-position:false}") boolean sortByPosition) {
        this.sortByPosition = sortByPosition;
    }

    /**
     * Extract text from PDF file
     * 
     * @param file PDF file to extract text from
     * @return Extracted text, or empty string if text is invalid
     * @throws PdfExtractionException If file is invalid or cannot be read
     */
    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new PdfExtractionException("File PDF trống hoặc null");
        }
        
        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".pdf")) {
            throw new PdfExtractionException("File phải là PDF");
        }

        try (InputStream in = file.getInputStream()) {
            return extractText(in);
        } catch (IOException e) {
            throw new PdfExtractionException("Không đọc được file PDF", e);
        }
    }

    /** Worker đọc bản PDF đã lưu ở MinIO, tách khỏi vòng đời MultipartFile của request. */
    public String extractText(InputStream input) {
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(input))) {
            
            if (!document.getCurrentAccessPermission().canExtractContent()) {
                throw new PdfExtractionException("PDF không cho phép trích văn bản");
            }
            
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(sortByPosition);
            stripper.setStartPage(1);
            // Đọc đủ các trang để không bỏ sót kỹ năng/học vấn ở cuối CV.
            stripper.setEndPage(document.getNumberOfPages());
            
            String text = stripper.getText(document);
            text = cleanText(text);
            if (text.length() > MAX_CHARS) {
                throw new PdfExtractionException("PDF vượt quá 200.000 ký tự, cần rút gọn trước khi phân tích");
            }
            
            if (text.length() < MIN_CHARS || garbledRatio(text) > MAX_GARBLED_RATIO) {
                return "";
            }
            return text;
            
        } catch (InvalidPasswordException e) {
            throw new PdfExtractionException("PDF được bảo vệ bằng mật khẩu", e);
        } catch (IOException e) {
            throw new PdfExtractionException("Không đọc được file PDF", e);
        }
    }

    /**
     * Clean extracted text
     */
    private String cleanText(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("\\h+", " ")
                .strip();
    }

    /**
     * Calculate ratio of garbled characters in text
     */
    private double garbledRatio(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        
        int garbledCount = 0;
        for (char c : text.toCharArray()) {
            // Characters in replacement character range or control characters
            if (c == '\ufffd' || (Character.isISOControl(c) && c != '\n' && c != '\r' && c != '\t')) {
                garbledCount++;
            }
        }
        return (double) garbledCount / text.length();
    }

    /**
     * Custom exception for PDF extraction errors
     */
    public static class PdfExtractionException extends RuntimeException {
        public PdfExtractionException(String message) {
            super(message);
        }

        public PdfExtractionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
