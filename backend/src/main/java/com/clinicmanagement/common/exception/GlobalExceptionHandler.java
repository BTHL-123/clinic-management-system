package com.clinicmanagement.common.exception;

import com.clinicmanagement.common.dto.ApiResponse;
import com.clinicmanagement.common.dto.FieldErrorResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException exception) {
        List<FieldErrorResponse> errors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorResponse(error.getField(), error.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(ApiResponse.validationError("Validation failed", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException exception) {
        List<FieldErrorResponse> errors = exception.getConstraintViolations().stream()
                .map(error -> new FieldErrorResponse(error.getPropertyPath().toString(), error.getMessage()))
                .toList();
        return ResponseEntity.badRequest().body(ApiResponse.validationError("Validation failed", errors));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException exception) {
        String message = "Dữ liệu không hợp lệ hoặc vi phạm ràng buộc cơ sở dữ liệu.";
        String rootCause = exception.getRootCause() != null ? exception.getRootCause().getMessage() : exception.getMessage();
        if (rootCause != null) {
            if (rootCause.contains("fk_doctor_schedules_doctor")) {
                message = "Bác sĩ không tồn tại trong hệ thống. Vui lòng kiểm tra lại ID bác sĩ.";
            } else if (rootCause.contains("uq_doctor_schedule")) {
                message = "Bác sĩ đã có một lịch làm việc khác trùng khớp thời gian trên ngày này.";
            } else if (rootCause.contains("doctor_schedules_pkey") || rootCause.contains("doctor_schedules_schedule_id")) {
                message = "Mã tự tăng của bảng lịch làm việc đang lệch. Vui lòng khởi động lại backend để hệ thống đồng bộ sequence.";
            } else if (rootCause.contains("appointment_slots_pkey") || rootCause.contains("appointment_slots_slot_id")) {
                message = "Mã tự tăng của bảng ca khám đang lệch. Vui lòng khởi động lại backend để hệ thống đồng bộ sequence.";
            } else if (rootCause.contains("fk_appointment_slots_schedule")) {
                message = "Lịch làm việc không tồn tại nên không thể tạo ca khám.";
            } else if (rootCause.contains("doctors_pkey") || rootCause.contains("doctors_doctor_id")) {
                message = "Mã tự tăng của bảng bác sĩ đang lệch. Vui lòng khởi động lại backend để hệ thống đồng bộ sequence.";
            } else if (rootCause.contains("doctors_doctor_code_key")) {
                message = "Mã bác sĩ đã tồn tại.";
            } else if (rootCause.contains("users_email_key")) {
                message = "Email đã tồn tại.";
            }
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message + " (Chi tiết: " + rootCause + ")"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid email or password"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception exception) {
        exception.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error: " + exception.getMessage()));
    }
}
