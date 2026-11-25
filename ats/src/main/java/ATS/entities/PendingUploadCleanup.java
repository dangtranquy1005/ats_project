package ATS.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/** Đăng ký trước khi ghi MinIO, xóa cùng transaction tạo CV thành công. */
@Entity
@Data
@Table(name = "tbl_pending_upload_cleanup")
public class PendingUploadCleanup {
    @Id
    @Column(length = 500)
    private String filePath;
    @Column(nullable = false)
    private LocalDateTime eligibleAt;
    private String cleanupToken;
}
