package ATS.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message",
                ex.getReason() == null ? "Không thể thực hiện yêu cầu này" : ex.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> constraint(DataIntegrityViolationException ex) {
        return ResponseEntity.status(409).body(Map.of("message", "Dữ liệu bị trùng hoặc đang được sử dụng. Hãy tải lại và kiểm tra"));
    }
}
