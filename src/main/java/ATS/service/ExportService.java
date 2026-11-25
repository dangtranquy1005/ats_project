package ATS.service;

import ATS.dto.ExportFile;
import ATS.enums.ExportFormat;

public interface ExportService {
    
    /**
     * Export job matching results to file
     * @param jobId Job ID to export
     * @param format Export format (CSV, EXCEL, PDF)
     * @param userId User ID
     * @return Export file with content and metadata
     */
    ExportFile export(Long jobId, ExportFormat format, Long userId);
}
