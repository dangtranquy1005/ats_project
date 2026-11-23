package ATS.service;

import ATS.dto.*;
import ATS.entities.*;
import ATS.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class SkillManagementService {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
    private final SkillRepository skills;
    private final SkillCategoryRepository categories;
    private final SkillAliasRepository aliases;
    private final JdbcTemplate jdbc;

    private void lockDictionary() {
        jdbc.execute("LOCK TABLE tbl_skill_category, tbl_skills, tbl_skill_alias IN SHARE ROW EXCLUSIVE MODE");
    }

    private String normalized(String value) {
        return WHITESPACE.matcher(Normalizer.normalize(value, Normalizer.Form.NFKC))
                .replaceAll(" ").strip().toLowerCase(Locale.ROOT);
    }

    private Skills skill(Long id) {
        return skills.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kỹ năng"));
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> search(String query) {
        String term = normalized(query == null ? "" : query);
        return skills.findAll().stream()
                .filter(s -> normalized(s.getCanonicalName()).contains(term)
                        || s.getAliases().stream().anyMatch(a -> normalized(a.getAliasText()).contains(term)))
                .sorted(Comparator.comparing(Skills::getCanonicalName, String.CASE_INSENSITIVE_ORDER))
                .map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories() {
        return categories.findAll().stream().sorted(Comparator.comparing(SkillCategory::getName))
                .map(c -> new CategoryResponse(c.getCategoryId(), c.getName(), c.getDescription())).toList();
    }

    public SkillResponse create(SkillRequest request) {
        lockDictionary();
        Skills skill = new Skills();
        apply(skill, request);
        return response(skills.save(skill));
    }

    public SkillResponse update(Long id, SkillRequest request) {
        lockDictionary();
        Skills skill = skill(id);
        apply(skill, request);
        return response(skill);
    }

    private void apply(Skills skill, SkillRequest request) {
        String name = validName(request.getCanonicalName());
        if (request.getSkillType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu loại kỹ năng");
        }
        ensureAvailable(name, skill.getSkillId());
        if (aliases.findAllWithSkills().stream().anyMatch(a -> normalized(a.getAliasText()).equals(normalized(name)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên kỹ năng trùng alias");
        }
        SkillCategory category = null;
        if (request.getCategoryId() != null) {
            category = categories.findById(request.getCategoryId()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhóm kỹ năng không tồn tại"));
        }
        skill.setCanonicalName(name);
        skill.setType(request.getSkillType());
        skill.setCategory(category);
    }

    private String validName(String name) {
        if (name == null || normalized(name).isEmpty() || name.strip().length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên phải có từ 1 đến 255 ký tự");
        }
        return WHITESPACE.matcher(Normalizer.normalize(name, Normalizer.Form.NFKC)).replaceAll(" ").strip();
    }

    private void ensureAvailable(String name, Long excludedSkillId) {
        if (skills.findAll().stream().anyMatch(s -> !s.getSkillId().equals(excludedSkillId)
                && normalized(s.getCanonicalName()).equals(normalized(name)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên kỹ năng đã tồn tại");
        }
    }

    public void delete(Long id) {
        lockDictionary();
        Skills skill = skill(id);
        if (!skill.getJobRequiredSkills().isEmpty() || !skill.getCvSkills().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Kỹ năng đang được JD hoặc CV sử dụng");
        }
        skills.delete(skill);
    }

    @Transactional(readOnly = true)
    public List<AliasResponse> listAliases(Long id) {
        skill(id);
        return aliases.findBySkillId(id).stream()
                .map(a -> new AliasResponse(a.getAliasId(), id, a.getAliasText())).toList();
    }

    public AliasResponse addAlias(Long id, String text) {
        lockDictionary();
        Skills skill = skill(id);
        String name = validName(text);
        ensureAvailable(name, null);
        if (aliases.findAllWithSkills().stream().anyMatch(a -> normalized(a.getAliasText()).equals(normalized(name)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Alias đã tồn tại");
        }
        SkillAlias alias = new SkillAlias();
        alias.setSkill(skill);
        alias.setAliasText(name);
        aliases.save(alias);
        return new AliasResponse(alias.getAliasId(), id, alias.getAliasText());
    }

    public void deleteAlias(Long id, Long aliasId) {
        lockDictionary();
        skill(id);
        aliases.delete(aliases.findByIdAndSkillId(aliasId, id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy alias")));
    }

    private SkillResponse response(Skills skill) {
        SkillCategory category = skill.getCategory();
        return SkillResponse.builder().skillId(skill.getSkillId()).canonicalName(skill.getCanonicalName())
                .skillType(skill.getType()).categoryId(category == null ? null : category.getCategoryId())
                .categoryName(category == null ? null : category.getName()).build();
    }
}
