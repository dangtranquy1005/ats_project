package ATS.service;

import ATS.dto.AnalyzeRequest;
import ATS.entities.SkillAlias;
import ATS.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/** Chụp từ điển bằng ID PostgreSQL thật. Quan hệ lazy được đọc trong transaction ngắn. */
@Service
@RequiredArgsConstructor
public class NlpSkillDictionary {
    private final SkillRepository skills;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<AnalyzeRequest.DictionarySkill> snapshot() {
        return skills.findDictionaryWithAliases().stream().map(skill ->
                new AnalyzeRequest.DictionarySkill(skill.getSkillId(), skill.getCanonicalName(),
                        skill.getAliases().stream().map(SkillAlias::getAliasText).sorted().toList(),
                        skill.getCategory() == null ? null : skill.getCategory().getName())).toList();
    }
}
