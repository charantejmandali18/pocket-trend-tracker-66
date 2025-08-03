package com.xpend.transaction.entity;

import com.xpend.transaction.converter.EncryptedBigDecimalConverter;
import com.xpend.transaction.converter.EncryptedStringConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transaction_user_id", columnList = "user_id"),
    @Index(name = "idx_transaction_group_id", columnList = "group_id"),
    @Index(name = "idx_transaction_category_id", columnList = "category_id"),
    @Index(name = "idx_transaction_type", columnList = "transaction_type"),
    @Index(name = "idx_transaction_date", columnList = "transaction_date"),
    @Index(name = "idx_transaction_created_by", columnList = "created_by"),
    @Index(name = "idx_transaction_source", columnList = "source"),
    @Index(name = "idx_transaction_user_date", columnList = "user_id, transaction_date"),
    @Index(name = "idx_transaction_user_type", columnList = "user_id, transaction_type")
})
@EntityListeners(AuditingEntityListener.class)
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "group_id")
    private UUID groupId;
    
    @NotNull
    @Column(name = "created_by", nullable = false)
    private Long createdBy;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType transactionType;
    
    @NotNull
    @Positive
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
    
    @NotBlank
    @Column(name = "description", nullable = false, length = 500)
    private String description;
    
    @NotNull
    @Column(name = "category_id", nullable = false)
    private UUID categoryId;
    
    @NotNull
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
    
    @NotBlank
    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;
    
    @NotBlank
    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @NotBlank
    @Column(name = "source", nullable = false, length = 50)
    private String source = "manual";
    
    @Column(name = "member_email", length = 100)
    private String memberEmail;
    
    // Audit fields
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Transaction() {}
    
    public Transaction(Long userId, Long createdBy, TransactionType transactionType, 
                      BigDecimal amount, String description, UUID categoryId, 
                      LocalDate transactionDate, String paymentMethod, String accountName) {
        this.userId = userId;
        this.createdBy = createdBy;
        this.transactionType = transactionType;
        this.amount = amount;
        this.description = description;
        this.categoryId = categoryId;
        this.transactionDate = transactionDate;
        this.paymentMethod = paymentMethod;
        this.accountName = accountName;
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
    
    // Business methods
    public boolean isGroupTransaction() {
        return groupId != null;
    }
    
    public boolean isIncome() {
        return transactionType == TransactionType.INCOME;
    }
    
    public boolean isExpense() {
        return transactionType == TransactionType.EXPENSE;
    }
    
    public boolean belongsToUser(Long userId) {
        return this.userId.equals(userId);
    }
    
    // Enums
    public enum TransactionType {
        INCOME, EXPENSE
    }
    
    @Override
    public String toString() {
        return "Transaction{" +
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