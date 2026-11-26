package ATS.controller;

import ATS.dto.JobDraftResponse;
import ATS.service.JobPdfImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/jobs")
public class JobImportController {
    private final JobPdfImportService imports;
    @PostMapping(value="/import-pdf",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public JobDraftResponse importPdf(@RequestParam("file") MultipartFile file) { return imports.analyze(file); }
}
