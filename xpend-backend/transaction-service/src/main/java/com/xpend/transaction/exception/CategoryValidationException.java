package com.xpend.transaction.exception;

import java.util.UUID;

public class CategoryValidationException extends RuntimeException {
    
    private final UUID categoryId;
    private final Long userId;
    
    public CategoryValidationException(UUID categoryId) {
        super("Invalid category ID: " + categoryId);
        this.categoryId = categoryId;
        this.userId = null;
    }
    
    public CategoryValidationException(UUID categoryId, Long userId) {
        super("Category " + categoryId + " is not accessible to user " + userId);
        this.categoryId = categoryId;
        this.userId = userId;
    }
    
    public CategoryValidationException(String message) {
        super(message);
        this.categoryId = null;
        this.userId = null;
    }
    
    public CategoryValidationException(String message, Throwable cause) {
        super(message, cause);
        this.categoryId = null;
        this.userId = null;
    }
    
    public UUID getCategoryId() {
        return categoryId;
    }
    
    public Long getUserId() {
        return userId;
    }
}