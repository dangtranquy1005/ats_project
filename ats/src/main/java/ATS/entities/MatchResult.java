package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "tbl_match_result")
public class MatchResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long matchResultId;
    
    @OneToOne
    @JoinColumn(name = "cv_id", nullable = false, unique = true)
    private CVs cv;
    
    @Column(nullable = false)
    // Tên cột cũ được giữ để tương thích DB. Từ weighted-coverage-v1, giá trị là điểm độ bao phủ.
    private Double jaccardScore;
    
    @Column(nullable = false)
    private Double cosineScore;
    
    @Column(nullable = false)
    private Double educationScore;
    
    @Column(nullable = false)
    private Double overallScore;

    // Điều kiện bắt buộc được ghi riêng với điểm tổng để giải thích hồ sơ không đạt.
    private boolean passedHardFilter;

    @Column(columnDefinition = "TEXT")
    // Bản chụp MatchDetailResponse tại thời điểm chấm, gồm điểm và căn cứ đối chiếu.
    private String detailsJson;

    // null khi tiêu chí JD thay đổi, service yêu cầu chấm lại trước khi hiển thị kết quả.
    private String algorithmVersion;

    @Column(nullable = false)
    // Cập nhật mỗi lần chấm lại cùng bản ghi.
    private LocalDateTime calculatedAt = LocalDateTime.now();
}
