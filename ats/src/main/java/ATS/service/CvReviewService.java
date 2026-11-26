package ATS.service;

import ATS.dto.*;
import ATS.entities.CVs;
import ATS.enums.*;
import ATS.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class CvReviewService {
    private final CVRepository cvs;
    private final JobRepository jobs;
    private static final java.util.Set<CVStatus> READY = EnumSet.of(CVStatus.PARSED, CVStatus.SCORED, CVStatus.REVIEWED);

    @Transactional(readOnly = true)
    public CvReviewResponse get(Long id, Long userId) {
        return response(cvs.findOwned(id, userId).orElseThrow(this::notFound));
    }

    public CvReviewResponse save(Long id, Long userId, CvReviewRequest request) {
        if (request.reviewStatus() == null || request.note() == null || request.note().length() > 5000
                || request.expectedVersion() == null || request.expectedVersion() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đánh giá không hợp lệ hoặc ghi chú vượt quá 5.000 ký tự");
        }
        Long jobId = cvs.findOwnedJobId(id, userId).orElseThrow(this::notFound);
        // Dùng cùng thứ tự khóa với chấm điểm: JD trước, CV sau.
        var job = jobs.findOwnedForUpdate(jobId, userId).orElseThrow(this::notFound);
        if (job.getStatus() != JobStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vị trí này đã đóng. Không thể cập nhật đánh giá");
        }
        CVs cv = cvs.findLocked(id).orElseThrow(this::notFound);
        if (cv.getHrReviewVersion() != request.expectedVersion()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Hồ sơ đã có đánh giá mới ở cửa sổ khác. Hãy tải bản mới trước khi lưu");
        }
        if (request.reviewStatus() != HrReviewStatus.PENDING && !READY.contains(cv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hãy chờ hồ sơ phân tích xong trước khi đánh giá");
        }
        if (cv.getHrReviewStatus() == request.reviewStatus() && Objects.equals(cv.getHrNote(), request.note())) {
            return response(cv);
        }
        if (cv.getHrReviewStatus() != request.reviewStatus()) {
            cv.setHrReviewedAt(request.reviewStatus() == HrReviewStatus.PENDING ? null
                    : LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        }
        cv.setHrReviewStatus(request.reviewStatus());
        cv.setHrNote(request.note());
        cv.setHrReviewVersion(cv.getHrReviewVersion() + 1);
        return response(cv);
    }

    private CvReviewResponse response(CVs cv) {
        boolean editable = cv.getJob().getStatus() == JobStatus.OPEN;
        return new CvReviewResponse(cv.getCvId(), cv.getJob().getJobId(), cv.getHrReviewStatus(),
                cv.getHrNote(), cv.getHrReviewedAt(), cv.getHrReviewVersion(), editable && READY.contains(cv.getStatus()), editable);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thuộc tài khoản");
    }
}
