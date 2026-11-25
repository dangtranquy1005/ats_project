package ATS.controller;

import ATS.dto.*;
import ATS.entities.User;
import ATS.service.ScoringService;
import ATS.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Các API nhận yêu cầu HTTP và chuyển việc tính điểm sang ScoringService. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ScoringController {
    private final ScoringService scoring;
    private final UserService users;

    private Long userId(Authentication authentication) {
        // Lấy userId từ danh tính đã xác thực để service kiểm tra quyền sở hữu JD/CV.
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User user = users.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getId();
    }

    @PostMapping("/jobs/{id}/rescore")
    // Chấm cả đợt CV của JD trong một transaction, trả số lượng đã cập nhật và bỏ qua.
    public RescoreResult rescore(@PathVariable Long id, Authentication auth) {
        return scoring.rescore(id, userId(auth));
    }

    @GetMapping("/jobs/{id}/ranking")
    // filter nhận minScore, maxScore, sortBy, sortOrder; pageable nhận page và size.
    public PageResponse<RankingItem> ranking(@PathVariable Long id, @ModelAttribute RankingFilter filter,
                                            Pageable pageable, Authentication auth) {
        return scoring.getRanking(id, userId(auth), filter, pageable);
    }

    @GetMapping("/cvs/{id}/match")
    // Đọc bản chụp điểm đã lưu, kèm kỹ năng đạt/thiếu và lý do không qua lọc cứng.
    public MatchDetailResponse detail(@PathVariable Long id, Authentication auth) {
        return scoring.getMatchDetail(id, userId(auth));
    }
}
