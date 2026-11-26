package ATS.controller;

import ATS.dto.PageResponse;
import ATS.service.UnknownSkillQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/unknown-skills")
@PreAuthorize("hasAuthority('ADMIN')")
public class UnknownSkillController {
    private final UnknownSkillQuery query;
    @GetMapping
    public PageResponse<UnknownSkillQuery.Item> list(@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="25") int size, @RequestParam(defaultValue="") String search) {
        return query.list(page, size, search);
    }
}
