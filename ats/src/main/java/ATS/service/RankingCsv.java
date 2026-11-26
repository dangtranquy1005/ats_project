package ATS.service;

import ATS.dto.RankingItem;
import ATS.enums.HrReviewStatus;
import java.util.List;
import java.util.Locale;

public final class RankingCsv {
    private RankingCsv() {}
    private static String cell(String value) {
        String text = value == null ? "" : value;
        // Tên/email là dữ liệu CV: ngăn bảng tính coi chúng là công thức khi mở CSV.
        String leading = text.stripLeading();
        if ((!leading.isEmpty() && "=+-@".indexOf(leading.charAt(0)) >= 0)
                || (!text.isEmpty() && "\t\r\n".indexOf(text.charAt(0)) >= 0)) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
    private static String score(Double value) { return value == null ? "" : String.format(Locale.ROOT, "%.1f", value * 100); }
    public static String write(List<RankingItem> items) {
        StringBuilder csv = new StringBuilder("\uFEFFThứ tự,ID CV,Ứng viên,Email,Đánh giá,Yêu cầu bắt buộc,Kỹ năng,Kinh nghiệm,Học vấn,Tổng /100\r\n");
        for (RankingItem item : items) {
            String review = item.getReviewStatus() == HrReviewStatus.SHORTLISTED ? "Phù hợp"
                    : item.getReviewStatus() == HrReviewStatus.REJECTED ? "Chưa phù hợp" : "Chưa đánh giá";
            csv.append(item.getRank()).append(',').append(item.getCvId()).append(',').append(cell(item.getCandidateName()))
                    .append(',').append(cell(item.getEmail())).append(',').append(cell(review)).append(',')
                    .append(cell(Boolean.TRUE.equals(item.getPassedHardFilter()) ? "Đạt" : "Không đạt")).append(',')
                    .append(score(item.getJaccardScore())).append(',').append(score(item.getCosineScore())).append(',')
                    .append(score(item.getEducationScore())).append(',').append(score(item.getOverallScore())).append("\r\n");
        }
        return csv.toString();
    }
}
