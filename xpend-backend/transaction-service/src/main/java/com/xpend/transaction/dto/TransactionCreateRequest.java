package com.xpend.transaction.dto;

import com.xpend.transaction.entity.Transaction.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class TransactionCreateRequest {
    
    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @DecimalMax(value = "999999999.99", message = "Amount cannot exceed 999,999,999.99")
    private BigDecimal amount;
    
    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    @NotNull(message = "Category ID is required")
    private UUID categoryId;
    
    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;
    
    @NotBlank(message = "Payment method is required")
    @Size(max = 50, message = "Payment method cannot exceed 50 characters")
    private String paymentMethod;
    
    @NotBlank(message = "Account name is required")
    @Size(max = 100, message = "Account name cannot exceed 100 characters")
    private String accountName;
    
    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;
    
    @Size(max = 50, message = "Source cannot exceed 50 characters")
    private String source = "manual";
    
    // Optional fields for group transactions
    private UUID groupId;
    
    @Email(message = "Member email must be valid")
    @Size(max = 100, message = "Member email cannot exceed 100 characters")
    private String memberEmail;
    
    // Constructors
    public TransactionCreateRequest() {}
    
    public TransactionCreateRequest(TransactionType transactionType, BigDecimal amount, 
                                  String description, UUID categoryId, LocalDate transactionDate, 
                                  String paymentMethod, String accountName) {
        this.transactionType = transactionType;
        this.amount = amount;
        this.description = description;
        this.categoryId = categoryId;
        this.transactionDate = transactionDate;
        this.paymentMethod = paymentMethod;
        this.accountName = accountName;
    }
    
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
    
    @Override
    public String toString() {
        return "TransactionCreateRequest{" +
                "transactionType=" + transactionType +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                ", categoryId=" + categoryId +
                ", transactionDate=" + transactionDate +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", accountName='" + accountName + '\'' +
                ", source='" + source + '\'' +
                ", groupId=" + groupId +
                '}';
    }
}