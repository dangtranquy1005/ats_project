package ATS.exceptionresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ATS.exceptionresponse.ErrorResponse;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BaseResponse<T> {
    private boolean success;
    private T result;
    private ErrorResponse error;
    private ResultInfo resultInfo;

    public static <T> BaseResponse<T> ok(T data, ResultInfo info) {
        return BaseResponse.<T>builder()
                .success(true)
                .result(data)
                .resultInfo(info)
                .build();
    }
    public static <T> BaseResponse<T> error(int code, String message) {
        return BaseResponse.<T>builder()
                .success(false)
                .error(ErrorResponse.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }
}