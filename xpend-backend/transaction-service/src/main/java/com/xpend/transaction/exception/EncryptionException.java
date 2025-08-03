package com.xpend.transaction.exception;

public class EncryptionException extends RuntimeException {
    
    private final String operation;
    
    public EncryptionException(String message) {
        super(message);
        this.operation = null;
    }
    
    public EncryptionException(String message, String operation) {
        super(message);
        this.operation = operation;
    }
    
    public EncryptionException(String message, Throwable cause) {
        super(message, cause);
        this.operation = null;
    }
    
    public EncryptionException(String message, String operation, Throwable cause) {
        super(message, cause);
        this.operation = operation;
    }
    
    public String getOperation() {
        return operation;
    }
    
    @Override
    public String toString() {
        return "EncryptionException{" +
                "message='" + getMessage() + '\'' +
                ", operation='" + operation + '\'' +
                '}';
    }
}