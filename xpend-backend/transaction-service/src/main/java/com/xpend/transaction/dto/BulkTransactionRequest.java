package com.xpend.transaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class BulkTransactionRequest {
    
    @NotEmpty(message = "Transaction list cannot be empty")
    @Size(max = 500, message = "Cannot process more than 500 transactions at once")
    @Valid
    private List<TransactionCreateRequest> transactions;
    
    @Size(max = 255, message = "Operation reason cannot exceed 255 characters")
    private String operationReason;
    
    private boolean continueOnError = false; // Whether to continue processing if some transactions fail
    
    // Constructors
    public BulkTransactionRequest() {}
    
    public BulkTransactionRequest(List<TransactionCreateRequest> transactions) {
        this.transactions = transactions;
    }
    
    public BulkTransactionRequest(List<TransactionCreateRequest> transactions, String operationReason) {
        this.transactions = transactions;
        this.operationReason = operationReason;
    }
    
    // Getters and Setters
    public List<TransactionCreateRequest> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionCreateRequest> transactions) { this.transactions = transactions; }
    
    public String getOperationReason() { return operationReason; }
    public void setOperationReason(String operationReason) { this.operationReason = operationReason; }
    
    public boolean isContinueOnError() { return continueOnError; }
    public void setContinueOnError(boolean continueOnError) { this.continueOnError = continueOnError; }
    
    // Helper methods
    public int getTransactionCount() {
        return transactions != null ? transactions.size() : 0;
    }
    
    @Override
    public String toString() {
        return "BulkTransactionRequest{" +
                "transactionCount=" + getTransactionCount() +
                ", operationReason='" + operationReason + '\'' +
                ", continueOnError=" + continueOnError +
                '}';
    }
}