package com.xpend.transaction.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTransactionNotFoundException(
            TransactionNotFoundException ex, WebRequest request) {
        
        logger.warn("Transaction not found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Transaction Not Found",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(TransactionAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleTransactionAccessDeniedException(
            TransactionAccessDeniedException ex, WebRequest request) {
        
        logger.warn("Transaction access denied: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            "Access Denied",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(TransactionValidationException.class)
    public ResponseEntity<ValidationErrorResponse> handleTransactionValidationException(
            TransactionValidationException ex, WebRequest request) {
        
        logger.warn("Transaction validation failed: {}", ex.getMessage());
        
        ValidationErrorResponse errorResponse = new ValidationErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(),
            ex.getValidationErrors() != null ? ex.getValidationErrors() : new HashMap<>()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(CategoryValidationException.class)
    public ResponseEntity<ErrorResponse> handleCategoryValidationException(
            CategoryValidationException ex, WebRequest request) {
        
        logger.warn("Category validation failed: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Invalid Category",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(BulkTransactionException.class)
    public ResponseEntity<BulkErrorResponse> handleBulkTransactionException(
            BulkTransactionException ex, WebRequest request) {
        
        logger.warn("Bulk transaction operation failed: {}", ex.getMessage());
        
        BulkErrorResponse errorResponse = new BulkErrorResponse(
            HttpStatus.MULTI_STATUS.value(),
            "Bulk Operation Completed with Errors",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(),
            ex.getTotalRequested(),
            ex.getSuccessCount(),
            ex.getFailureCount(),
            ex.getIndexedErrors()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.MULTI_STATUS);
    }
    
    @ExceptionHandler(EncryptionException.class)
    public ResponseEntity<ErrorResponse> handleEncryptionException(
            EncryptionException ex, WebRequest request) {
        
        logger.error("Encryption/Decryption error: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Data Processing Error",
            "An error occurred while processing sensitive data. Please try again.",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        logger.warn("Request validation failed for: {}", request.getDescription(false));
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ValidationErrorResponse errorResponse = new ValidationErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            "Request validation failed",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now(),
            errors
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        
        logger.warn("Invalid argument: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Invalid Request",
            ex.getMessage(),
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {
        
        logger.error("Unexpected error occurred", ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "An unexpected error occurred. Please try again later.",
            request.getDescription(false).replace("uri=", ""),
            LocalDateTime.now()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    // ===============================
    // Error Response Classes
    // ===============================
    
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private String path;
        private LocalDateTime timestamp;
        
        public ErrorResponse(int status, String error, String message, String path, LocalDateTime timestamp) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.path = path;
            this.timestamp = timestamp;
        }
        
        // Getters
        public int getStatus() { return status; }
        public String getError() { return error; }
        public String getMessage() { return message; }
        public String getPath() { return path; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
    
    public static class ValidationErrorResponse extends ErrorResponse {
        private Map<String, String> validationErrors;
        
        public ValidationErrorResponse(int status, String error, String message, String path, 
                                     LocalDateTime timestamp, Map<String, String> validationErrors) {
            super(status, error, message, path, timestamp);
            this.validationErrors = validationErrors;
        }
        
        public Map<String, String> getValidationErrors() { return validationErrors; }
    }
    
    public static class BulkErrorResponse extends ErrorResponse {
        private int totalRequested;
        private int successCount;
        private int failureCount;
        private double successRate;
        private Map<Integer, String> indexedErrors;
        
        public BulkErrorResponse(int status, String error, String message, String path,
                               LocalDateTime timestamp, int totalRequested, int successCount,
                               int failureCount, Map<Integer, String> indexedErrors) {
            super(status, error, message, path, timestamp);
            this.totalRequested = totalRequested;
            this.successCount = successCount;
            this.failureCount = failureCount;
            this.successRate = totalRequested > 0 ? (double) successCount / totalRequested : 0.0;
            this.indexedErrors = indexedErrors;
        }
        
        // Getters
        public int getTotalRequested() { return totalRequested; }
        public int getSuccessCount() { return successCount; }
        public int getFailureCount() { return failureCount; }
        public double getSuccessRate() { return successRate; }
        public Map<Integer, String> getIndexedErrors() { return indexedErrors; }
    }
}