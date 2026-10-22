package com.mekongstorybox.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.dao.QueryTimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.TransactionTimedOutException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/**
 * Trả lỗi dạng JSON thống nhất, không lộ stack trace / câu lệnh SQL ra ngoài,
 * và map đúng mã HTTP thay vì để mọi lỗi thành 500 (hoặc 403 qua /error).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalidBody(MethodArgumentNotValidException exception) {
        var fieldError = exception.getBindingResult().getFieldError();
        var message = fieldError == null
                ? "Dữ liệu gửi lên không hợp lệ."
                : "Trường '" + fieldError.getField() + "' không hợp lệ: " + fieldError.getDefaultMessage();
        return body(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, HandlerMethodValidationException.class})
    public ResponseEntity<Map<String, Object>> unreadable(Exception exception) {
        return body(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> uploadTooLarge(MaxUploadSizeExceededException exception) {
        return body(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh tối đa 5MB.");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> invalidMultipart(MultipartException exception) {
        return body(HttpStatus.BAD_REQUEST, "File tải lên không hợp lệ.");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> responseStatus(ResponseStatusException exception) {
        return body(exception.getStatusCode(), exception.getReason());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> authentication(AuthenticationException exception) {
        return body(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> dataIntegrity(DataIntegrityViolationException exception) {
        log.warn("Data integrity violation: {}", exception.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT, "Dữ liệu bị trùng hoặc vi phạm ràng buộc. Vui lòng kiểm tra lại.");
    }

    @ExceptionHandler({PessimisticLockingFailureException.class, ObjectOptimisticLockingFailureException.class,
            QueryTimeoutException.class, TransactionTimedOutException.class})
    public ResponseEntity<Map<String, Object>> busy(Exception exception) {
        log.warn("Request aborted because the database was busy: {}", exception.getMessage());
        return body(HttpStatus.SERVICE_UNAVAILABLE, "Hệ thống đang bận, vui lòng thử lại sau ít phút.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> unexpected(Exception exception) {
        // Các lỗi chuẩn của Spring MVC (404, 405, 415...) đã mang sẵn mã HTTP đúng
        if (exception instanceof ErrorResponse errorResponse) {
            return body(errorResponse.getStatusCode(), errorResponse.getBody().getDetail());
        }
        log.error("Unhandled exception", exception);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra ở máy chủ. Vui lòng thử lại sau.");
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatusCode status, String message) {
        var response = new HashMap<String, Object>();
        response.put("success", false);
        response.put("data", null);
        response.put("status", status.value());
        response.put("message", message == null ? "Yêu cầu không hợp lệ." : message);
        return ResponseEntity.status(status).body(response);
    }
}
