package ATS.service;

/** Lỗi có phân loại để worker quyết định ghi PARSED_FAILED hoặc lên lịch thử lại. */
public class NlpClientException extends RuntimeException {
    public enum Reason { INVALID_REQUEST, HTTP_ERROR, TIMEOUT, CONNECTION_ERROR, INVALID_RESPONSE }

    private final Reason reason;
    private final Integer httpStatus;
    private final boolean retryable;

    public NlpClientException(Reason reason, String message, Integer httpStatus, boolean retryable, Throwable cause) {
        super(message, cause);
        this.reason = reason;
        this.httpStatus = httpStatus;
        this.retryable = retryable;
    }

    public Reason getReason() { return reason; }
    public Integer getHttpStatus() { return httpStatus; }
    public boolean isRetryable() { return retryable; }
}
