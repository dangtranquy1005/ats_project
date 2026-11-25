package ATS.service;

import ATS.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SkillService {
    

    List<SkillResponse> search(String query);

    List<CategoryResponse> listCategories();
    SkillResponse createSkill(SkillRequest request);

    SkillResponse updateSkill(Long skillId, SkillRequest request);

    void deleteSkill(Long skillId);
    AliasResponse addAlias(Long skillId, String aliasText);
    void deleteAlias(Long skillId, Long aliasId);
    Page<UnknownSkillResponse> listUnknownSkills(Pageable pageable);
}
