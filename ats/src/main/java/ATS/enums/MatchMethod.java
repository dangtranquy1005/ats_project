package ATS.enums;

public enum MatchMethod {
    // Khớp tên chuẩn của kỹ năng, không phân biệt hoa/thường.
    EXACT,
    // Khớp một biến thể đã khai báo trong từ điển, ví dụ SpringBoot -> Spring Boot.
    ALIAS,
    // Giá trị cho dữ liệu cũ. NLP hiện trả gợi ý fuzzy riêng để chờ xác nhận.
    FUZZY
}
