package ATS.exceptionresponse;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResultInfo {
    private int size;
    private int totalPages;
    private int page;
    private long totalElements;
}