package com.xpend.transaction.dto;

import com.xpend.transaction.entity.Transaction.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class TransactionUpdateRequest {
    
    private TransactionType transactionType;
    
    @Positive(message = "Amount must be positive")
    @DecimalMax(value = "999999999.99", message = "Amount cannot exceed 999,999,999.99")
    private BigDecimal amount;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    private UUID categoryId;
    
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;
    
    @Size(max = 50, message = "Payment method cannot exceed 50 characters")
    private String paymentMethod;
    
    @Size(max = 100, message = "Account name cannot exceed 100 characters")
    private String accountName;
    
    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
    
    @Size(max = 50, message = "Source cannot exceed 50 characters")
    private String source;
    
    // Optional fields for group transactions
    private UUID groupId;
    
    @Email(message = "Member email must be valid")
    @Size(max = 100, message = "Member email cannot exceed 100 characters")
    private String memberEmail;
    
    // Optional reason for the update (for audit purposes)
    @Size(max = 255, message = "Update reason cannot exceed 255 characters")
    private String updateReason;
    
    // Constructors
    public TransactionUpdateRequest() {}
    
    // Getters and Setters
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
    
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    
    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }
    
    public String getUpdateReason() { return updateReason; }
    public void setUpdateReason(String updateReason) { this.updateReason = updateReason; }
    
    // Helper methods to check if fields are being updated
    public boolean hasTransactionType() { return transactionType != null; }
    public boolean hasAmount() { return amount != null; }
    public boolean hasDescription() { return description != null && !description.trim().isEmpty(); }
    public boolean hasCategoryId() { return categoryId != null; }
    public boolean hasTransactionDate() { return transactionDate != null; }
    public boolean hasPaymentMethod() { return paymentMethod != null && !paymentMethod.trim().isEmpty(); }
    public boolean hasAccountName() { return accountName != null && !accountName.trim().isEmpty(); }
    public boolean hasNotes() { return notes != null; }
    public boolean hasSource() { return source != null && !source.trim().isEmpty(); }
    public boolean hasGroupId() { return groupId != null; }
    public boolean hasMemberEmail() { return memberEmail != null; }
    
    @Override
    public String toString() {
        return "TransactionUpdateRequest{" +
                "transactionType=" + transactionType +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                ", categoryId=" + categoryId +
                ", transactionDate=" + transactionDate +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", accountName='" + accountName + '\'' +
                ", source='" + source + '\'' +
                ", groupId=" + groupId +
                ", updateReason='" + updateReason + '\'' +
                '}';
    }
}