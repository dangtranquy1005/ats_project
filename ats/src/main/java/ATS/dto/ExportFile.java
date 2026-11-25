package ATS.dto;

import ATS.enums.ExportFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportFile {
    private String fileName;
    private byte[] content;
    private String contentType;
    private ExportFormat format;
}
