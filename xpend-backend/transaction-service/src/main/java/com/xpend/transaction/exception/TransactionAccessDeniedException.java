package com.xpend.transaction.exception;

import java.util.UUID;

public class TransactionAccessDeniedException extends RuntimeException {
    
    private final UUID transactionId;
    private final Long userId;
    
    public TransactionAccessDeniedException(UUID transactionId, Long userId) {
        super("Access denied to transaction " + transactionId + " for user " + userId);
        this.transactionId = transactionId;
        this.userId = userId;
    }
    
    public TransactionAccessDeniedException(String message) {
        super(message);
        this.transactionId = null;
        this.userId = null;
    }
    
    public TransactionAccessDeniedException(String message, Throwable cause) {
        super(message, cause);
        this.transactionId = null;
        this.userId = null;
    }
    
    public UUID getTransactionId() {
        return transactionId;
    }
    
    public Long getUserId() {
        return userId;
    }
}