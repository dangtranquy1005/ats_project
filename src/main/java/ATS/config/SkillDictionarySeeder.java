package ATS.config;

import ATS.entities.SkillAlias;
import ATS.entities.SkillCategory;
import ATS.entities.Skills;
import ATS.enums.SkillType;
import ATS.repository.SkillAliasRepository;
import ATS.repository.SkillCategoryRepository;
import ATS.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ats.skills.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SkillDictionarySeeder implements ApplicationRunner {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);

    private final JsonMapper jsonMapper;
    private final JdbcTemplate jdbcTemplate;
    private final SkillCategoryRepository categoryRepository;
    private final SkillRepository skillRepository;
    private final SkillAliasRepository aliasRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(ApplicationArguments args) throws Exception {
        List<SeedSkill> entries;
        try (var input = new ClassPathResource("skills.json").getInputStream()) {
            entries = Arrays.asList(jsonMapper.readValue(input, SeedSkill[].class));
        }
        validate(entries);

        // Serialize imports and dictionary writes across application instances.
        jdbcTemplate.execute("LOCK TABLE tbl_skill_category, tbl_skills, tbl_skill_alias "
                + "IN SHARE ROW EXCLUSIVE MODE");

        Map<String, SkillCategory> categories = new HashMap<>();
        categoryRepository.findAll().forEach(category ->
                categories.putIfAbsent(normalize(category.getName()), category));

        Map<String, Skills> skillsByName = new HashMap<>();
        skillRepository.findAll().forEach(skill ->
                skillsByName.putIfAbsent(normalize(skill.getCanonicalName()), skill));

        Map<String, Long> existingAliases = new HashMap<>();
        aliasRepository.findAllWithSkills().forEach(alias ->
                existingAliases.putIfAbsent(normalize(alias.getAliasText()), alias.getSkill().getSkillId()));

        int skillsAdded = 0;
        int aliasesAdded = 0;
        for (SeedSkill entry : entries) {
            String name = normalize(entry.canonicalName());
            if (skillsByName.containsKey(name)) {
                continue;
            }
            if (existingAliases.containsKey(name)) {
                log.warn("Skipping seed skill '{}' because its name already exists as an alias", entry.canonicalName());
                continue;
            }

            SkillCategory category = categories.computeIfAbsent(normalize(entry.category()), ignored -> {
                SkillCategory newCategory = new SkillCategory();
                newCategory.setName(entry.category().strip());
                return categoryRepository.save(newCategory);
            });
            Skills skill = new Skills();
            skill.setCanonicalName(entry.canonicalName().strip());
            skill.setType(entry.type());
            skill.setCategory(category);
            skillsByName.put(name, skillRepository.save(skill));
            skillsAdded++;
        }

        for (SeedSkill entry : entries) {
            Skills skill = skillsByName.get(normalize(entry.canonicalName()));
            if (skill == null) {
                continue;
            }
            for (String text : entry.aliases()) {
                String aliasName = normalize(text);
                Long existingOwner = existingAliases.get(aliasName);
                if (skillsByName.containsKey(aliasName)
                        || (existingOwner != null && !existingOwner.equals(skill.getSkillId()))) {
                    log.warn("Skipping seed alias '{}' for '{}' because the name is already in use",
                            text, entry.canonicalName());
                    continue;
                }
                if (existingOwner == null) {
                    SkillAlias alias = new SkillAlias();
                    alias.setSkill(skill);
                    alias.setAliasText(text.strip());
                    aliasRepository.save(alias);
                    existingAliases.put(aliasName, skill.getSkillId());
                    aliasesAdded++;
                }
            }
        }
        log.info("Skill dictionary seed added {} skills and {} aliases", skillsAdded, aliasesAdded);
    }

    private static void validate(List<SeedSkill> entries) {
        Set<String> keys = new HashSet<>();
        Set<String> terms = new HashSet<>();
        for (SeedSkill entry : entries) {
            if (entry == null || entry.key() == null || !entry.key().matches("[a-z0-9]+(-[a-z0-9]+)*")
                    || !keys.add(entry.key()) || entry.category() == null || entry.category().isBlank()
                    || entry.type() == null || entry.aliases() == null) {
                throw new IllegalArgumentException("Invalid skill entry in skills.json: " + entry);
            }
            addTerm(terms, entry.canonicalName());
            entry.aliases().forEach(alias -> addTerm(terms, alias));
        }
    }

    private static void addTerm(Set<String> terms, String term) {
        if (term == null || normalize(term).isEmpty() || !terms.add(normalize(term))) {
            throw new IllegalArgumentException("Empty or duplicate skill name in skills.json: " + term);
        }
    }

    private static String normalize(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFKC);
        return WHITESPACE.matcher(normalized).replaceAll(" ").strip().toLowerCase(Locale.ROOT);
    }

    private record SeedSkill(String key, String canonicalName, String category, SkillType type, List<String> aliases) {
    }
}
