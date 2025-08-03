package com.xpend.transaction.exception;

import java.util.List;
import java.util.Map;

public class TransactionValidationException extends RuntimeException {
    
    private final Map<String, String> validationErrors;
    private final List<String> errorMessages;
    
    public TransactionValidationException(String message) {
        super(message);
        this.validationErrors = null;
        this.errorMessages = null;
    }
    
    public TransactionValidationException(String message, Map<String, String> validationErrors) {
        super(message);
        this.validationErrors = validationErrors;
        this.errorMessages = null;
    }
    
    public TransactionValidationException(String message, List<String> errorMessages) {
        super(message);
        this.validationErrors = null;
        this.errorMessages = errorMessages;
    }
    
    public TransactionValidationException(String message, Throwable cause) {
        super(message, cause);
        this.validationErrors = null;
        this.errorMessages = null;
    }
    
    public Map<String, String> getValidationErrors() {
        return validationErrors;
    }
    
    public List<String> getErrorMessages() {
        return errorMessages;
    }
    
    public boolean hasValidationErrors() {
        return validationErrors != null && !validationErrors.isEmpty();
    }
    
    public boolean hasErrorMessages() {
        return errorMessages != null && !errorMessages.isEmpty();
    }
}