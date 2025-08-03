package com.xpend.transaction.dto;

import com.xpend.transaction.entity.Transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class TransactionResponse {
    
    private UUID id;
    private Long userId;
    private UUID groupId;
    private Long createdBy;
    private TransactionType transactionType;
    private BigDecimal amount;
    private String description;
    private UUID categoryId;
    private LocalDate transactionDate;
    private String paymentMethod;
    private String accountName;
    private String notes;
    private String source;
    private String memberEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional fields for response enhancement
    private String categoryName; // Will be populated from category service
    private String createdByName; // Will be populated from user service
    
    // Constructors
    public TransactionResponse() {}
    
    public TransactionResponse(UUID id, Long userId, UUID groupId, Long createdBy,
                             TransactionType transactionType, BigDecimal amount, String description,
                             UUID categoryId, LocalDate transactionDate, String paymentMethod,
                             String accountName, String notes, String source, String memberEmail,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.groupId = groupId;
        this.createdBy = createdBy;
        this.transactionType = transactionType;
        this.amount = amount;
        this.description = description;
        this.categoryId = categoryId;
        this.transactionDate = transactionDate;
        this.paymentMethod = paymentMethod;
        this.accountName = accountName;
        this.notes = notes;
        this.source = source;
        this.memberEmail = memberEmail;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    
    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    
    // Helper methods
    public boolean isGroupTransaction() {
        return groupId != null;
    }
    
    public boolean isIncome() {
        return transactionType == TransactionType.INCOME;
    }
    
    public boolean isExpense() {
        return transactionType == TransactionType.EXPENSE;
    }
    
    @Override
    public String toString() {
        return "TransactionResponse{" +
                "id=" + id +
                ", userId=" + userId +
                ", transactionType=" + transactionType +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                ", categoryId=" + categoryId +
                ", transactionDate=" + transactionDate +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", source='" + source + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}