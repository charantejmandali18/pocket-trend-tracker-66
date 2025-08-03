package com.xpend.transaction.dto;

import com.xpend.transaction.entity.Transaction.TransactionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class TransactionSearchCriteria {
    
    // User isolation - always required
    private Long userId;
    
    // Basic filters
    private TransactionType transactionType;
    private List<UUID> categoryIds;
    private List<String> paymentMethods;
    private List<String> sources;
    
    // Amount filters
    @Positive(message = "Minimum amount must be positive")
    private BigDecimal minAmount;
    
    @Positive(message = "Maximum amount must be positive")
    private BigDecimal maxAmount;
    
    // Date filters
    private LocalDate fromDate;
    private LocalDate toDate;
    
    // Text search
    private String descriptionKeyword;
    private String accountNameKeyword;
    private String notesKeyword;
    
    // Group filters
    private UUID groupId;
    private Boolean isGroupTransaction; // null = all, true = group only, false = individual only
    
    // Member filters
    private String memberEmail;
    
    // Pagination
    @Min(value = 0, message = "Page number must be non-negative")
    private int page = 0;
    
    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 100, message = "Page size cannot exceed 100")
    private int size = 20;
    
    // Sorting
    private String sortBy = "transactionDate"; // Default sort by date
    private String sortDirection = "desc"; // Default newest first
    
    // Date range presets
    private DateRangePreset dateRangePreset;
    
    public enum DateRangePreset {
        TODAY,
        YESTERDAY,
        THIS_WEEK,
        LAST_WEEK,
        THIS_MONTH,
        LAST_MONTH,
        THIS_QUARTER,
        LAST_QUARTER,
        THIS_YEAR,
        LAST_YEAR,
        LAST_7_DAYS,
        LAST_30_DAYS,
        LAST_90_DAYS
    }
    
    // Constructors
    public TransactionSearchCriteria() {}
    
    public TransactionSearchCriteria(Long userId) {
        this.userId = userId;
    }
    
    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    
    public List<UUID> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<UUID> categoryIds) { this.categoryIds = categoryIds; }
    
    public List<String> getPaymentMethods() { return paymentMethods; }
    public void setPaymentMethods(List<String> paymentMethods) { this.paymentMethods = paymentMethods; }
    
    public List<String> getSources() { return sources; }
    public void setSources(List<String> sources) { this.sources = sources; }
    
    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }
    
    public BigDecimal getMaxAmount() { return maxAmount; }
    public void setMaxAmount(BigDecimal maxAmount) { this.maxAmount = maxAmount; }
    
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    
    public String getDescriptionKeyword() { return descriptionKeyword; }
    public void setDescriptionKeyword(String descriptionKeyword) { this.descriptionKeyword = descriptionKeyword; }
    
    public String getAccountNameKeyword() { return accountNameKeyword; }
    public void setAccountNameKeyword(String accountNameKeyword) { this.accountNameKeyword = accountNameKeyword; }
    
    public String getNotesKeyword() { return notesKeyword; }
    public void setNotesKeyword(String notesKeyword) { this.notesKeyword = notesKeyword; }
    
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    
    public Boolean getIsGroupTransaction() { return isGroupTransaction; }
    public void setIsGroupTransaction(Boolean isGroupTransaction) { this.isGroupTransaction = isGroupTransaction; }
    
    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }
    
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
    
    public DateRangePreset getDateRangePreset() { return dateRangePreset; }
    public void setDateRangePreset(DateRangePreset dateRangePreset) { this.dateRangePreset = dateRangePreset; }
    
    // Helper methods
    public boolean hasTextSearch() {
        return (descriptionKeyword != null && !descriptionKeyword.trim().isEmpty()) ||
               (accountNameKeyword != null && !accountNameKeyword.trim().isEmpty()) ||
               (notesKeyword != null && !notesKeyword.trim().isEmpty());
    }
    
    public boolean hasAmountFilter() {
        return minAmount != null || maxAmount != null;
    }
    
    public boolean hasDateFilter() {
        return fromDate != null || toDate != null || dateRangePreset != null;
    }
    
    public boolean hasCategoryFilter() {
        return categoryIds != null && !categoryIds.isEmpty();
    }
    
    @Override
    public String toString() {
        return "TransactionSearchCriteria{" +
                "userId=" + userId +
                ", transactionType=" + transactionType +
                ", categoryIds=" + (categoryIds != null ? categoryIds.size() + " categories" : "null") +
                ", minAmount=" + minAmount +
                ", maxAmount=" + maxAmount +
                ", fromDate=" + fromDate +
                ", toDate=" + toDate +
                ", page=" + page +
                ", size=" + size +
                ", sortBy='" + sortBy + '\'' +
                ", sortDirection='" + sortDirection + '\'' +
                '}';
    }
}