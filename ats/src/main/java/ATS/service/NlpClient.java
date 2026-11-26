package ATS.service;

import ATS.dto.AnalyzeRequest;
import ATS.dto.AnalyzeResponse;
import ATS.enums.MatchMethod;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Giao tiếp FastAPI. Worker gọi analyze() ngoài transaction lưu CV để không giữ
 * khóa DB trong lúc chờ HTTP. Việc lưu và chuyển trạng thái CV thuộc CvProcessingTx.
 */
@Service
public class NlpClient {
    private final RestClient http;
    private final NlpSkillDictionary dictionary;

    public NlpClient(@Qualifier("nlpRestClient") RestClient http, NlpSkillDictionary dictionary) {
        this.http = http;
        this.dictionary = dictionary;
    }

    public AnalyzeResponse analyze(AnalyzeRequest request) {
        validateRequest(request);
        // Tạo bản request riêng để cùng một request có thể được gọi lại mà không bị sửa dữ liệu.
        // Từ điển rỗng được gửi nguyên trạng. Chỉ null mới yêu cầu đọc từ PostgreSQL.
        AnalyzeRequest body = AnalyzeRequest.builder().cvId(request.getCvId()).rawText(request.getRawText())
                .fileType(request.getFileType())
                .languageHint(request.getLanguageHint() == null ? "auto" : request.getLanguageHint())
                .skillDictionary(request.getSkillDictionary() == null ? dictionary.snapshot() : request.getSkillDictionary())
                .build();
        try {
            AnalyzeResponse response = http.post().uri("/nlp/extract")
                    .contentType(MediaType.APPLICATION_JSON).accept(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(AnalyzeResponse.class);
            validateResponse(body, response);
            response.setProcessingToken(request.getProcessingToken());
            return response;
        } catch (RestClientResponseException error) {
            int status = error.getStatusCode().value();
            // Không đưa body lỗi vào exception vì FastAPI có thể trả lại nguyên văn text CV.
            throw new NlpClientException(NlpClientException.Reason.HTTP_ERROR,
                    "NLP service trả HTTP " + status, status, status == 408 || status == 429 || status >= 500, null);
        } catch (ResourceAccessException error) {
            boolean timeout = isTimeout(error);
            throw new NlpClientException(timeout ? NlpClientException.Reason.TIMEOUT : NlpClientException.Reason.CONNECTION_ERROR,
                    timeout ? "NLP service vượt quá thời gian chờ" : "Không kết nối được NLP service",
                    null, true, error);
        } catch (RestClientException error) {
            throw new NlpClientException(NlpClientException.Reason.INVALID_RESPONSE,
                    "NLP service trả dữ liệu JSON không hợp lệ hoặc sai hợp đồng", null, false, error);
        }
    }

    private void validateRequest(AnalyzeRequest request) {
        if (request == null || request.getRawText() == null || request.getRawText().isBlank()
                || request.getRawText().codePointCount(0, request.getRawText().length()) > 200_000
                || (request.getCvId() != null && request.getCvId() <= 0)
                || (request.getLanguageHint() != null && !Set.of("auto", "vi", "en").contains(request.getLanguageHint()))) {
            throw new NlpClientException(NlpClientException.Reason.INVALID_REQUEST,
                    "Request NLP cần text có từ 1 đến 200.000 ký tự, cvId dương và languageHint hợp lệ", null, false, null);
        }
    }

    private void validateResponse(AnalyzeRequest request, AnalyzeResponse response) {
        if (response == null || !Objects.equals(request.getCvId(), response.getCvId())
                || response.getSkills() == null || response.getExperiences() == null || response.getEducations() == null) {
            throw invalidResponse("Phản hồi NLP rỗng, thiếu danh sách kết quả hoặc sai cvId");
        }
        Set<Long> ids = request.getSkillDictionary().stream().map(AnalyzeRequest.DictionarySkill::id)
                .collect(Collectors.toSet());
        for (AnalyzeResponse.Skill skill : response.getSkills()) {
            if (skill == null || skill.skillId() == null || !ids.contains(skill.skillId())
                    || (skill.matchMethod() != MatchMethod.EXACT && skill.matchMethod() != MatchMethod.ALIAS)) {
                throw invalidResponse("Kỹ năng NLP trả về không thuộc từ điển đã gửi hoặc có phương thức khớp không hợp lệ");
            }
        }
    }

    private NlpClientException invalidResponse(String message) {
        return new NlpClientException(NlpClientException.Reason.INVALID_RESPONSE, message, null, false, null);
    }

    private boolean isTimeout(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SocketTimeoutException || cause instanceof HttpTimeoutException) {
                return true;
            }
        }
        return false;
    }
}
