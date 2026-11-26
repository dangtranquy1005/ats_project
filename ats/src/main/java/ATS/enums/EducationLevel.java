package ATS.enums;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;

/** Cấp học dùng khi so khớp; giữ nguyên bằng cấp gốc trong CV để HR đối chiếu. */
public enum EducationLevel {
    NONE(0), COLLEGE(1), UNIVERSITY(2), MASTER(3), DOCTORATE(4);
    private final int rank;
    EducationLevel(int rank) { this.rank = rank; }
    public boolean meets(EducationLevel required) { return rank >= required.rank; }
    public static String fold(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replace('đ','d')
                .replaceAll("[^a-z0-9]+", " ").strip();
    }
    public static Optional<EducationLevel> parse(String value) {
        String text=fold(value);
        if (text.isBlank() || text.equals("none") || text.equals("khong yeu cau")
                || text.equals("khong bat buoc")) return Optional.of(NONE);
        if (text.matches(".*\\b(doctorate|doctoral|phd|ph d|doctor of philosophy|tien si)\\b.*")) return Optional.of(DOCTORATE);
        if (text.matches(".*\\b(master|masters|msc|m sc|mba|m eng|meng|thac si)\\b.*")) return Optional.of(MASTER);
        if (text.matches(".*\\b(university|bachelor|bachelors|bsc|b sc|ba|b a|beng|b eng|bs|engineer|dai hoc|cu nhan|ky su)\\b.*")) return Optional.of(UNIVERSITY);
        if (text.matches(".*\\b(college|associate|associates|cao dang)\\b.*")) return Optional.of(COLLEGE);
        return Optional.empty();
    }
    public static boolean unfinished(String source) {
        return fold(source).matches(".*\\b(in progress|pursuing|expected|anticipated|candidate|not graduated|chua tot nghiep|dang hoc|du kien|dang theo hoc)\\b.*");
    }
    /** Giữ nguyên yêu cầu văn bản cũ chưa biết cấp học, tránh làm mất dữ liệu khi sửa JD. */
    public static String canonicalRequirement(String value) {
        return parse(value).map(Enum::name).orElse(value == null ? "NONE" : value.strip());
    }
}
