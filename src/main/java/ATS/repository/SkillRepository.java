package ATS.repository;

import ATS.entities.SkillAlias;
import ATS.entities.Skills;
import ATS.entities.SkillCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skills, Long> {
    Optional<Skills> findById(Long id);

    List<Skills> findAllById(List<Long> ids);

    List<Skills> findAllByCanonicalNameIn(List<String> names);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Skills s WHERE LOWER(s.canonicalName) = LOWER(:name)")
    boolean existsByCanonicalNameIgnoreCase(@Param("name") String name);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Skills s WHERE LOWER(s.canonicalName) = LOWER(:name) AND s.skillId != :id")
    boolean existsByCanonicalNameIgnoreCaseAndIdNot(@Param("name") String name, @Param("id") Long id);

    @Query("SELECT CASE WHEN COUNT(sa) > 0 THEN true ELSE false END FROM SkillAlias sa WHERE LOWER(sa.aliasText) = LOWER(:aliasText)")
    boolean existsAliasByIgnoreCase(@Param("aliasText") String aliasText);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Skills s WHERE s.id = :skillId")
    boolean isInUse(@Param("skillId") Long skillId);

    Skills save(Skills skill);

    void delete(Skills skill);

    Optional<SkillAlias> findAliasByIdAndSkillId(Long aliasId, Long skillId);

    SkillAlias saveAlias(SkillAlias skillAlias);

    void deleteAlias(SkillAlias alias);

    List<SkillCategory> findAllCategories();

    Optional<SkillCategory> findCategoryById(Long id);

    @Query("SELECT s FROM Skills s WHERE s.skillId NOT IN (SELECT cs.skill.id FROM CVSkills cs)")
    Page<Skills> findUnknownCandidates(Pageable pageable);
}
