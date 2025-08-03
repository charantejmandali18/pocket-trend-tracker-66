package com.xpend.transaction.exception;

import java.util.List;
import java.util.Map;

public class BulkTransactionException extends RuntimeException {
    
    private final int totalRequested;
    private final int successCount;
    private final int failureCount;
    private final Map<Integer, String> indexedErrors;
    private final List<String> generalErrors;
    
    public BulkTransactionException(String message, int totalRequested, int successCount, int failureCount) {
        super(message);
        this.totalRequested = totalRequested;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.indexedErrors = null;
        this.generalErrors = null;
    }
    
    public BulkTransactionException(String message, int totalRequested, int successCount, int failureCount,
                                  Map<Integer, String> indexedErrors) {
        super(message);
        this.totalRequested = totalRequested;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.indexedErrors = indexedErrors;
        this.generalErrors = null;
    }
    
    public BulkTransactionException(String message, int totalRequested, int successCount, int failureCount,
                                  List<String> generalErrors) {
        super(message);
        this.totalRequested = totalRequested;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.indexedErrors = null;
        this.generalErrors = generalErrors;
    }
    
    public BulkTransactionException(String message, Throwable cause) {
        super(message, cause);
        this.totalRequested = 0;
        this.successCount = 0;
        this.failureCount = 0;
        this.indexedErrors = null;
        this.generalErrors = null;
    }
    
    public int getTotalRequested() {
        return totalRequested;
    }
    
    public int getSuccessCount() {
        return successCount;
    }
    
    public int getFailureCount() {
        return failureCount;
    }
    
    public Map<Integer, String> getIndexedErrors() {
        return indexedErrors;
    }
    
    public List<String> getGeneralErrors() {
        return generalErrors;
    }
    
    public boolean hasIndexedErrors() {
        return indexedErrors != null && !indexedErrors.isEmpty();
    }
    
    public boolean hasGeneralErrors() {
        return generalErrors != null && !generalErrors.isEmpty();
    }
    
    public double getSuccessRate() {
        return totalRequested > 0 ? (double) successCount / totalRequested : 0.0;
    }
    
    @Override
    public String toString() {
        return "BulkTransactionException{" +
                "message='" + getMessage() + '\'' +
                ", totalRequested=" + totalRequested +
                ", successCount=" + successCount +
                ", failureCount=" + failureCount +
                ", successRate=" + String.format("%.2f%%", getSuccessRate() * 100) +
                '}';
    }
}