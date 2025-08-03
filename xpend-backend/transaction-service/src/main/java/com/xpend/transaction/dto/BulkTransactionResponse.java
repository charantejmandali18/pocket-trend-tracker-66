package com.xpend.transaction.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BulkTransactionResponse {
    
    private int totalRequested;
    private int successCount;
    private int failureCount;
    private List<TransactionResponse> successfulTransactions;
    private List<TransactionError> errors;
    private LocalDateTime processedAt;
    private boolean hasErrors;
    
    public static class TransactionError {
        private int index; // Index in the original request
        private String error;
        private String message;
        private TransactionCreateRequest originalRequest;
        
        public TransactionError() {}
        
        public TransactionError(int index, String error, String message, TransactionCreateRequest originalRequest) {
            this.index = index;
            this.error = error;
            this.message = message;
            this.originalRequest = originalRequest;
        }
        
        // Getters and Setters
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public TransactionCreateRequest getOriginalRequest() { return originalRequest; }
        public void setOriginalRequest(TransactionCreateRequest originalRequest) { this.originalRequest = originalRequest; }
        
        @Override
        public String toString() {
            return "TransactionError{" +
                    "index=" + index +
                    ", error='" + error + '\'' +
                    ", message='" + message + '\'' +
                    '}';
        }
    }
    
    // Constructors
    public BulkTransactionResponse() {
        this.successfulTransactions = new ArrayList<>();
        this.errors = new ArrayList<>();
        this.processedAt = LocalDateTime.now();
    }
    
    public BulkTransactionResponse(int totalRequested) {
        this();
        this.totalRequested = totalRequested;
    }
    
    // Getters and Setters
    public int getTotalRequested() { return totalRequested; }
    public void setTotalRequested(int totalRequested) { this.totalRequested = totalRequested; }
    
    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    
    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }
    
    public List<TransactionResponse> getSuccessfulTransactions() { return successfulTransactions; }
    public void setSuccessfulTransactions(List<TransactionResponse> successfulTransactions) { 
        this.successfulTransactions = successfulTransactions;
        this.successCount = successfulTransactions != null ? successfulTransactions.size() : 0;
    }
    
    public List<TransactionError> getErrors() { return errors; }
    public void setErrors(List<TransactionError> errors) { 
        this.errors = errors;
        this.failureCount = errors != null ? errors.size() : 0;
        this.hasErrors = failureCount > 0;
    }
    
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
    
    public boolean isHasErrors() { return hasErrors; }
    public void setHasErrors(boolean hasErrors) { this.hasErrors = hasErrors; }
    
    // Helper methods
    public void addSuccessfulTransaction(TransactionResponse transaction) {
        if (successfulTransactions == null) {
            successfulTransactions = new ArrayList<>();
        }
        successfulTransactions.add(transaction);
        this.successCount = successfulTransactions.size();
    }
    
    public void addError(int index, String error, String message, TransactionCreateRequest originalRequest) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(new TransactionError(index, error, message, originalRequest));
        this.failureCount = errors.size();
        this.hasErrors = true;
    }
    
    public boolean isCompleteSuccess() {
        return failureCount == 0 && successCount == totalRequested;
    }
    
    public boolean isCompleteFailure() {
        return successCount == 0 && failureCount == totalRequested;
    }
    
    public boolean isPartialSuccess() {
        return successCount > 0 && failureCount > 0;
    }
    
    public double getSuccessRate() {
        return totalRequested > 0 ? (double) successCount / totalRequested : 0.0;
    }
    
    @Override
    public String toString() {
        return "BulkTransactionResponse{" +
                "totalRequested=" + totalRequested +
                ", successCount=" + successCount +
                ", failureCount=" + failureCount +
                ", hasErrors=" + hasErrors +
                ", successRate=" + String.format("%.2f%%", getSuccessRate() * 100) +
                ", processedAt=" + processedAt +
                '}';
    }
}