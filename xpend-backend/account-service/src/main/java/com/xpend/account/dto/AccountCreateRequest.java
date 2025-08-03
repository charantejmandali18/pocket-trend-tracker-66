package com.xpend.account.dto;

import com.xpend.account.entity.Account;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public class AccountCreateRequest {

    @NotBlank(message = "Account name is required")
    @Size(max = 255, message = "Account name must not exceed 255 characters")
    private String accountName;

    @NotNull(message = "Account type is required")
    private Account.AccountType accountType;

    @NotNull(message = "Balance is required")
    private BigDecimal balance;

    @DecimalMin(value = "0.0", message = "Credit limit must be non-negative")
    private BigDecimal creditLimit;

    @Size(max = 255, message = "Bank name must not exceed 255 characters")
    private String bankName;

    @Size(max = 50, message = "Account number must not exceed 50 characters")
    private String accountNumber;

    private Boolean isPrimary = false;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a valid 3-letter code")
    private String currency = "INR";

    private String description;

    private UUID groupId; // For group accounts

    // Constructors
    public AccountCreateRequest() {
    }

    public AccountCreateRequest(String accountName, Account.AccountType accountType, BigDecimal balance) {
        this.accountName = accountName;
        this.accountType = accountType;
        this.balance = balance;
    }

    // Getters and Setters
    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }

    public Account.AccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(Account.AccountType accountType) {
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
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
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

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }
}