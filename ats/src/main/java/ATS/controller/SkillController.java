package ATS.controller;

import ATS.dto.*;
import ATS.service.SkillManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SkillController {
    private final SkillManagementService skills;

    @GetMapping("/skills")
    public List<SkillResponse> search(@RequestParam(defaultValue = "") String query) {
        return skills.search(query);
    }

    @GetMapping("/skill-categories")
    public List<CategoryResponse> categories() {
        return skills.listCategories();
    }

    @PostMapping("/skills")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public SkillResponse create(@RequestBody SkillRequest request) {
        return skills.create(request);
    }

    @PutMapping("/skills/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public SkillResponse update(@PathVariable Long id, @RequestBody SkillRequest request) {
        return skills.update(id, request);
    }

    @DeleteMapping("/skills/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        skills.delete(id);
    }

    @GetMapping("/skills/{id}/aliases")
    public List<AliasResponse> aliases(@PathVariable Long id) {
        return skills.listAliases(id);
    }

    @PostMapping("/skills/{id}/aliases")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AliasResponse alias(@PathVariable Long id, @RequestBody AliasRequest request) {
        return skills.addAlias(id, request.aliasText());
    }

    @DeleteMapping("/skills/{id}/aliases/{aliasId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAlias(@PathVariable Long id, @PathVariable Long aliasId) {
        skills.deleteAlias(id, aliasId);
    }

    @PostMapping("/skill-categories")
    @ResponseStatus(HttpStatus.CREATED)
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public CategoryResponse createCategory(@RequestBody CategoryRequest request) {
        return skills.saveCategory(null, request);
    }

    @PutMapping("/skill-categories/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public CategoryResponse updateCategory(@PathVariable Long id, @RequestBody CategoryRequest request) {
        return skills.saveCategory(id, request);
    }

    @DeleteMapping("/skill-categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ADMIN')")
    public void deleteCategory(@PathVariable Long id) { skills.deleteCategory(id); }

    public record AliasRequest(String aliasText) {}
}
