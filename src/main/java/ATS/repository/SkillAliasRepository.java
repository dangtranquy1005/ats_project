package ATS.repository;

import ATS.entities.SkillAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillAliasRepository extends JpaRepository<SkillAlias, Long> {

    @Query("SELECT CASE WHEN COUNT(sa) > 0 THEN true ELSE false END FROM SkillAlias sa WHERE LOWER(sa.aliasText) = LOWER(:aliasText)")
    boolean existsByAliasTextIgnoreCase(@Param("aliasText") String aliasText);

    /**
     * Find SkillAlias by aliasId and skillId with JOIN to Skills table
     * Returns SkillAlias with associated Skill data
     */
    @Query("SELECT sa FROM SkillAlias sa " +
            "JOIN sa.skill s " +
            "WHERE sa.aliasId = :aliasId AND s.skillId = :skillId")
    Optional<SkillAlias> findByIdAndSkillId(
            @Param("aliasId") Long aliasId,
            @Param("skillId") Long skillId);

    /**
     * Find all SkillAliases with their associated Skills (INNER JOIN with FETCH)
     */
    @Query("SELECT sa FROM SkillAlias sa " +
            "JOIN FETCH sa.skill s " +
            "ORDER BY s.canonicalName ASC, sa.aliasText ASC")
    List<SkillAlias> findAllWithSkills();

    /**
     * Find all SkillAliases for a specific skill
     */
    @Query("SELECT sa FROM SkillAlias sa " +
            "WHERE sa.skill.skillId = :skillId " +
            "ORDER BY sa.aliasText ASC")
    List<SkillAlias> findBySkillId(@Param("skillId") Long skillId);

    /**
     * Find SkillAlias by alias text with Skill details (FETCH JOIN to load skill eager)
     */
    @Query("SELECT sa FROM SkillAlias sa " +
            "JOIN FETCH sa.skill s " +
            "WHERE LOWER(sa.aliasText) = LOWER(:aliasText)")
    Optional<SkillAlias> findByAliasTextIgnoreCase(@Param("aliasText") String aliasText);

    SkillAlias save(SkillAlias skillAlias);

    void delete(SkillAlias alias);
}
