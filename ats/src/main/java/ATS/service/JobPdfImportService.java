package ATS.service;

import ATS.dto.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/** Chỉ trả bản nháp; không lưu JD, PDF hay thay đổi từ điển trước khi người dùng xác nhận. */
@Service
public class JobPdfImportService {
    private final PdfTextExtractor pdf;
    private final NlpSkillDictionary dictionary;
    private final RestClient http;
    public JobPdfImportService(PdfTextExtractor pdf, NlpSkillDictionary dictionary,
            @Qualifier("nlpRestClient") RestClient http) {
        this.pdf=pdf; this.dictionary=dictionary; this.http=http;
    }
    public JobDraftResponse analyze(MultipartFile file) {
        if(file == null || file.isEmpty() || file.getSize()>10L*1024*1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Chọn một PDF có dung lượng từ 1 byte đến 10 MB");
        String text;
        try { text=pdf.extractText(file); }
        catch(PdfTextExtractor.PdfExtractionException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,ex.getMessage());
        }
        if(text.isBlank()) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Không đọc được văn bản trong PDF. Hãy dùng bản PDF có thể chọn và sao chép chữ");
        var snapshot=dictionary.snapshot();
        JobDraftResponse draft;
        try {
            draft=http.post().uri("/nlp/extract-job").contentType(MediaType.APPLICATION_JSON)
                    .body(AnalyzeRequest.builder().rawText(text).languageHint("auto").fileType("pdf").skillDictionary(snapshot).build())
                    .retrieve().body(JobDraftResponse.class);
        } catch(ResourceAccessException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa kết nối được dịch vụ phân tích hoặc đã hết thời gian chờ. Hãy thử lại");
        } catch(RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Dịch vụ phân tích chưa trả được kết quả hợp lệ. Hãy thử lại");
        }
        if(draft==null || draft.requiredSkills()==null || draft.warnings()==null
                || (draft.minExperienceYears()!=null&&draft.minExperienceYears()<0)) throw invalid();
        Map<Long,String> ids=new HashMap<>();snapshot.forEach(s->ids.put(s.id(),s.canonical()));
        Set<Long> seen=new HashSet<>();
        var items=new ArrayList<JobDraftResponse.Skill>();
        for(var skill:draft.requiredSkills()) {
            if(skill==null || !ids.containsKey(skill.skillId()) || !seen.add(skill.skillId())
                    || skill.mandatory()==null) throw invalid();
            items.add(new JobDraftResponse.Skill(skill.skillId(),ids.get(skill.skillId()),skill.mandatory(),1.0,skill.sourceText()));
        }
        // Chỉ cho phép cấp học chuẩn; không để phản hồi lạ tự trở thành yêu cầu tự do.
        String education=draft.educationRequirements();
        if(education!=null && !Set.of("NONE","COLLEGE","UNIVERSITY","MASTER","DOCTORATE").contains(education)) throw invalid();
        return new JobDraftResponse(draft.title(),text,draft.minExperienceYears(),education,items,draft.warnings(),draft.experienceSource(),draft.educationSource());
    }
    private ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Kết quả phân tích không hợp lệ. Hãy thử lại hoặc tạo vị trí bằng cách nhập tay");
    }
}
