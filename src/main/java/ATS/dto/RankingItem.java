package ATS.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
public class RankingItem {
    private Long cvId;
    private Long jobId;
    private Double overallScore;
    private Double jaccardScore;
    private Double cosineScore;
    private Double educationScore;
    private String candidateName;
    private String email;
    private Integer rank;  // Set by service layer after pagination

    /**
     * Constructor used by JPQL constructor expression (without rank).
     * Rank is calculated in the service layer.
     */
    public RankingItem(Long cvId, Long jobId,
                       Double overallScore, Double jaccardScore,
                       Double cosineScore, Double educationScore,
                       String candidateName, String email) {
        this.cvId = cvId;
        this.jobId = jobId;
        this.overallScore = overallScore;
        this.jaccardScore = jaccardScore;
        this.cosineScore = cosineScore;
        this.educationScore = educationScore;
        this.candidateName = candidateName;
        this.email = email;
    }

    /**
     * Full constructor with rank (used by builder/service layer)
     */
    public RankingItem(Long cvId, Long jobId,
                       Double overallScore, Double jaccardScore,
                       Double cosineScore, Double educationScore,
                       String candidateName, String email,
                       Integer rank) {
        this(cvId, jobId, overallScore, jaccardScore, cosineScore, educationScore, candidateName, email);
        this.rank = rank;
    }
}
