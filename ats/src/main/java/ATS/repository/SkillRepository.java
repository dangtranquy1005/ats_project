package ATS.repository;

import ATS.entities.Skills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skills, Long> {
    @Query("SELECT DISTINCT s FROM Skills s LEFT JOIN FETCH s.aliases LEFT JOIN FETCH s.category ORDER BY s.skillId")
    List<Skills> findDictionaryWithAliases();
    Optional<Skills> findById(Long id);

//    List<Skills> findAllById(List<Long> ids);

    List<Skills> findAllByCanonicalNameIn(List<String> names);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Skills s WHERE LOWER(s.canonicalName) = LOWER(:name)")
    boolean existsByCanonicalNameIgnoreCase(@Param("name") String name);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Skills s WHERE LOWER(s.canonicalName) = LOWER(:name) AND s.skillId != :id")
    boolean existsByCanonicalNameIgnoreCaseAndIdNot(@Param("name") String name, @Param("id") Long id);

//    Skills save(Skills skill);

//    void delete(Skills skill);
}
