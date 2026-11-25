package ATS.repository;

import ATS.entities.Skills;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillCVRepository extends JpaRepository<Skills, Long> {

    @Query("SELECT s FROM Skills s WHERE s.id NOT IN (SELECT cs.skill.id FROM CVSkills cs)")
    Page<Skills> findUnknownCandidates(Pageable pageable);
}
