package com.xpend.transaction.exception;

import java.util.UUID;

public class TransactionNotFoundException extends RuntimeException {
    
    private final UUID transactionId;
    private final Long userId;
    
    public TransactionNotFoundException(UUID transactionId) {
        super("Transaction not found with ID: " + transactionId);
        this.transactionId = transactionId;
        this.userId = null;
    }
    
    public TransactionNotFoundException(UUID transactionId, Long userId) {
        super("Transaction not found with ID: " + transactionId + " for user: " + userId);
        this.transactionId = transactionId;
        this.userId = userId;
    }
    
    public TransactionNotFoundException(String message) {
        super(message);
        this.transactionId = null;
        this.userId = null;
    }
    
    public TransactionNotFoundException(String message, Throwable cause) {
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