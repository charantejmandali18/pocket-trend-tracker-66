package com.xpend.account.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_balance_history")
@EntityListeners(AuditingEntityListener.class)
public class AccountBalanceHistory {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    @NotNull(message = "Account is required")
    private Account account;

    @Column(name = "balance_before", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Balance before is required")
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Balance after is required")
    private BigDecimal balanceAfter;

    @Column(name = "change_amount", nullable = false, precision = 15, scale = 2)
    @NotNull(message = "Change amount is required")
    private BigDecimal changeAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_reason", nullable = false)
    @NotNull(message = "Change reason is required")
    private ChangeReason changeReason;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    @NotNull(message = "Created by is required")
    private Long createdBy;

    public enum ChangeReason {
        TRANSACTION,
        MANUAL_ADJUSTMENT,
        INTEREST,
        FEE,
        TRANSFER,
        RECONCILIATION
    }

    // Constructors
    public AccountBalanceHistory() {
    }

    public AccountBalanceHistory(Account account, BigDecimal balanceBefore, BigDecimal balanceAfter, 
                                ChangeReason changeReason, Long createdBy) {
        this.account = account;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.changeAmount = balanceAfter.subtract(balanceBefore);
        this.changeReason = changeReason;
        this.createdBy = createdBy;
    }

    public AccountBalanceHistory(Account account, BigDecimal balanceBefore, BigDecimal balanceAfter, 
                                ChangeReason changeReason, UUID referenceId, String referenceType, 
                                String description, Long createdBy) {
        this.account = account;
        this.balanceBefore = balanceBefore;
        this.balanceAfter = balanceAfter;
        this.changeAmount = balanceAfter.subtract(balanceBefore);
        this.changeReason = changeReason;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
        this.description = description;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public BigDecimal getBalanceBefore() {
        return balanceBefore;
    }

    public void setBalanceBefore(BigDecimal balanceBefore) {
        this.balanceBefore = balanceBefore;
    }

    public BigDecimal getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(BigDecimal balanceAfter) {
        this.balanceAfter = balanceAfter;
    }

    public BigDecimal getChangeAmount() {
        return changeAmount;
    }

    public void setChangeAmount(BigDecimal changeAmount) {
        this.changeAmount = changeAmount;
    }

    public ChangeReason getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(ChangeReason changeReason) {
        this.changeReason = changeReason;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
}