package ATS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyzeRequest {
    private Long cvId;
    private String rawText;
    private String fileType;
    @Builder.Default
    private String languageHint = "auto";
    private List<DictionarySkill> skillDictionary;
    // Token nội bộ Java để phân biệt các lần xử lý, không gửi sang FastAPI.
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String processingToken;

    // Hỗ trợ lời gọi constructor cũ. Client sẽ bổ sung từ điển DB khi trường này là null.
    public AnalyzeRequest(Long cvId, String rawText, String fileType) {
        this.cvId = cvId;
        this.rawText = rawText;
        this.fileType = fileType;
    }

    public record DictionarySkill(Long id, String canonical, List<String> aliases, String category) {}
}
