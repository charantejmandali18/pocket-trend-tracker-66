package com.xpend.account.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@EntityListeners(AuditingEntityListener.class)
public class Account {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    @NotNull(message = "User ID is required")
    private Long userId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "account_name", nullable = false)
    @NotBlank(message = "Account name is required")
    @Size(max = 255, message = "Account name must not exceed 255 characters")
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @Column(name = "balance", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Balance is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Balance must be non-negative")
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "available_credit", precision = 15, scale = 2)
    private BigDecimal availableCredit;

    @Column(name = "outstanding_amount", precision = 15, scale = 2)
    private BigDecimal outstandingAmount;

    @Column(name = "bank_name")
    @Size(max = 255, message = "Bank name must not exceed 255 characters")
    private String bankName;

    @Column(name = "account_number_hash")
    private String accountNumberHash;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "currency", nullable = false, length = 3)
    @NotBlank(message = "Currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a valid 3-letter code")
    private String currency = "INR";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    @NotNull(message = "Created by is required")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccountBalanceHistory> balanceHistory;

    public enum AccountType {
        SAVINGS,
        CHECKING,
        CREDIT_CARD,
        LOAN,
        CASH,
        INVESTMENT
    }

    // Constructors
    public Account() {
    }

    public Account(Long userId, String accountName, AccountType accountType, BigDecimal balance) {
        this.userId = userId;
        this.accountName = accountName;
        this.accountType = accountType;
        this.balance = balance;
    }

    // Business methods
    public void updateBalance(BigDecimal newBalance, String reason, Long updatedBy, UUID referenceId, String referenceType) {
        BigDecimal oldBalance = this.balance;
        this.balance = newBalance;
        this.updatedBy = updatedBy;
        
        // Update credit card specific fields
        if (accountType == AccountType.CREDIT_CARD && creditLimit != null) {
            this.availableCredit = creditLimit.subtract(newBalance);
            this.outstandingAmount = newBalance;
        }
    }

    public boolean isCreditCard() {
        return accountType == AccountType.CREDIT_CARD;
    }

    public boolean isAsset() {
        return accountType != AccountType.CREDIT_CARD && accountType != AccountType.LOAN;
    }

    public boolean isLiability() {
        return accountType == AccountType.CREDIT_CARD || accountType == AccountType.LOAN;
    }

    public BigDecimal getEffectiveBalance() {
        if (isCreditCard()) {
            return availableCredit != null ? availableCredit : BigDecimal.ZERO;
        }
        return balance;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
        if (creditLimit != null && balance != null) {
            this.availableCredit = creditLimit.subtract(balance);
        }
    }

    public BigDecimal getAvailableCredit() {
        return availableCredit;
    }

    public void setAvailableCredit(BigDecimal availableCredit) {
        this.availableCredit = availableCredit;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumberHash() {
        return accountNumberHash;
    }

    public void setAccountNumberHash(String accountNumberHash) {
        this.accountNumberHash = accountNumberHash;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public List<AccountBalanceHistory> getBalanceHistory() {
        return balanceHistory;
    }

    public void setBalanceHistory(List<AccountBalanceHistory> balanceHistory) {
        this.balanceHistory = balanceHistory;
    }
}