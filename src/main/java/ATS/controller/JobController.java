package ATS.controller;

import ATS.dto.*;
import ATS.entities.User;
import ATS.enums.JobStatus;
import ATS.service.UserService;
import ATS.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobs;
    private final UserService users;

    private Long userId(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User user = users.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return user.getId();
    }

    @PostMapping
    public ResponseEntity<JobResponse> create(@RequestBody JobRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobs.createJob(request, userId(auth)));
    }

    @GetMapping
    public Page<JobSummaryResponse> list(Pageable pageable, Authentication auth) {
        return jobs.listJobsByUserId(userId(auth), pageable);
    }

    @GetMapping("/{id}")
    public JobDetailResponse detail(@PathVariable Long id, Authentication auth) {
        return jobs.getJob(id, userId(auth));
    }

    @PutMapping("/{id}")
    public JobResponse update(@PathVariable Long id, @RequestBody JobRequest request, Authentication auth) {
        return jobs.updateJob(id, request, userId(auth));
    }

    @PatchMapping("/{id}/status")
    public JobResponse status(@PathVariable Long id, @RequestBody StatusRequest request, Authentication auth) {
        return jobs.changeStatus(id, request.status(), userId(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        jobs.deleteJob(id, userId(auth));
    }

    @GetMapping("/{id}/skills")
    public List<JobSkillResponse> skills(@PathVariable Long id, Authentication auth) {
        return jobs.getRequiredSkills(id, userId(auth));
    }

    @PutMapping("/{id}/skills")
    public JobResponse skills(@PathVariable Long id, @RequestBody List<JobSkillRequest> items, Authentication auth) {
        return jobs.replaceRequiredSkills(id, items, userId(auth));
    }

    @GetMapping("/{id}/scoring-config")
    public ScoringConfigResponse config(@PathVariable Long id, Authentication auth) {
        return jobs.getConfig(id, userId(auth));
    }

    @PutMapping("/{id}/scoring-config")
    public ScoringConfigResponse config(@PathVariable Long id, @RequestBody ScoringConfigRequest request,
                                        Authentication auth) {
        return jobs.updateConfig(id, request, userId(auth));
    }

    public record StatusRequest(JobStatus status) {}
}
