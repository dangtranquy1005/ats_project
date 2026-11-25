package ATS.service.impl;

import java.text.Normalizer;
import java.util.*;

/**
 * Tính độ tương đồng nội dung kinh nghiệm với mô tả JD bằng TF-IDF và Cosine.
 * Mỗi lần tính dùng tập hai văn bản gồm JD và kinh nghiệm của một CV,
 * nên thêm CV khác vào vị trí tuyển dụng không làm đổi điểm của cặp đang xét.
 */
final class TextSimilarity {
    private TextSimilarity() {}

    static double cosine(String job, String experience) {
        // Mỗi map lưu token và số lần token xuất hiện trong văn bản tương ứng.
        Map<String, Integer> left = counts(job);
        Map<String, Integer> right = counts(experience);
        if (left.isEmpty() || right.isEmpty()) {
            // Văn bản rỗng không tạo được vector có độ dài dương.
            return 0;
        }
        // Hợp token của hai văn bản tạo các chiều của hai vector.
        Set<String> vocabulary = new HashSet<>(left.keySet());
        vocabulary.addAll(right.keySet());
        double dot = 0;
        double leftLength = 0;
        double rightLength = 0;
        for (String token : vocabulary) {
            // frequency là số văn bản chứa token (1 hoặc 2).
            // IDF làm trơn = ln((N + 1) / (frequency + 1)) + 1, với N = 2.
            int frequency = (left.containsKey(token) ? 1 : 0) + (right.containsKey(token) ? 1 : 0);
            double idf = Math.log(3.0 / (1 + frequency)) + 1;
            // TF dùng 1 + ln(số lần xuất hiện), token vắng mặt có trọng số 0.
            double a = left.containsKey(token) ? (1 + Math.log(left.get(token))) * idf : 0;
            double b = right.containsKey(token) ? (1 + Math.log(right.get(token))) * idf : 0;
            dot += a * b;
            // Tích vô hướng và bình phương độ dài phục vụ công thức Cosine.
            leftLength += a * a;
            rightLength += b * b;
        }
        // Cosine = (A.B) / (||A|| * ||B||). Chặn sai số số thực vượt nhẹ quá 1.
        return Math.min(1, dot / Math.sqrt(leftLength * rightLength));
    }

    private static Map<String, Integer> counts(String text) {
        Map<String, Integer> counts = new HashMap<>();
        if (text == null) {
            return counts;
        }
        // Chuẩn hóa Unicode và hoa/thường. Dấu tiếng Việt vẫn được giữ trong phép so khớp này.
        // Bộ tách từ giữ ký tự +, # và . để hỗ trợ tên công nghệ như C++, C#, .NET.
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        for (String term : normalized.split("[^\\p{L}\\p{N}+#.]+")) {
            if (!term.isBlank() && !term.equals(".")) {
                counts.merge(term, 1, Integer::sum);
            }
        }
        return counts;
    }
}
