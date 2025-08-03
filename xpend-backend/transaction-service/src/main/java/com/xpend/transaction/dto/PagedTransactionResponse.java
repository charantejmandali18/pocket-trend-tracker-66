package com.xpend.transaction.dto;

import java.math.BigDecimal;
import java.util.List;

public class PagedTransactionResponse {
    
    private List<TransactionResponse> transactions;
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private int pageSize;
    private boolean hasNext;
    private boolean hasPrevious;
    private boolean isFirst;
    private boolean isLast;
    
    // Summary statistics
    private TransactionSummary summary;
    
    public static class TransactionSummary {
        private BigDecimal totalIncome;
        private BigDecimal totalExpenses;
        private BigDecimal netAmount;
        private long incomeCount;
        private long expenseCount;
        private long totalCount;
        
        public TransactionSummary() {}
        
        public TransactionSummary(BigDecimal totalIncome, BigDecimal totalExpenses, 
                                long incomeCount, long expenseCount) {
            this.totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
            this.totalExpenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
            this.netAmount = this.totalIncome.subtract(this.totalExpenses);
            this.incomeCount = incomeCount;
            this.expenseCount = expenseCount;
            this.totalCount = incomeCount + expenseCount;
        }
        
        // Getters and Setters
        public BigDecimal getTotalIncome() { return totalIncome; }
        public void setTotalIncome(BigDecimal totalIncome) { 
            this.totalIncome = totalIncome;
            calculateNetAmount();
        }
        
        public BigDecimal getTotalExpenses() { return totalExpenses; }
        public void setTotalExpenses(BigDecimal totalExpenses) { 
            this.totalExpenses = totalExpenses;
            calculateNetAmount();
        }
        
        public BigDecimal getNetAmount() { return netAmount; }
        
        public long getIncomeCount() { return incomeCount; }
        public void setIncomeCount(long incomeCount) { 
            this.incomeCount = incomeCount;
            this.totalCount = this.incomeCount + this.expenseCount;
        }
        
        public long getExpenseCount() { return expenseCount; }
        public void setExpenseCount(long expenseCount) { 
            this.expenseCount = expenseCount;
            this.totalCount = this.incomeCount + this.expenseCount;
        }
        
        public long getTotalCount() { return totalCount; }
        
        private void calculateNetAmount() {
            if (totalIncome != null && totalExpenses != null) {
                this.netAmount = totalIncome.subtract(totalExpenses);
            }
        }
    }
    
    // Constructors
    public PagedTransactionResponse() {}
    
    public PagedTransactionResponse(List<TransactionResponse> transactions, int currentPage, 
                                  int totalPages, long totalElements, int pageSize) {
        this.transactions = transactions;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.pageSize = pageSize;
        this.hasNext = currentPage < totalPages - 1;
        this.hasPrevious = currentPage > 0;
        this.isFirst = currentPage == 0;
        this.isLast = currentPage == totalPages - 1;
    }
    
    // Getters and Setters
    public List<TransactionResponse> getTransactions() { return transactions; }
    public void setTransactions(List<TransactionResponse> transactions) { this.transactions = transactions; }
    
    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
    
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    
    public boolean isHasNext() { return hasNext; }
    public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
    
    public boolean isHasPrevious() { return hasPrevious; }
    public void setHasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; }
    
    public boolean isFirst() { return isFirst; }
    public void setFirst(boolean first) { isFirst = first; }
    
    public boolean isLast() { return isLast; }
    public void setLast(boolean last) { isLast = last; }
    
    public TransactionSummary getSummary() { return summary; }
    public void setSummary(TransactionSummary summary) { this.summary = summary; }
    
    // Helper methods
    public boolean isEmpty() {
        return transactions == null || transactions.isEmpty();
    }
    
    public int getNumberOfElements() {
        return transactions != null ? transactions.size() : 0;
    }
    
    @Override
    public String toString() {
        return "PagedTransactionResponse{" +
                "transactionCount=" + (transactions != null ? transactions.size() : 0) +
                ", currentPage=" + currentPage +
                ", totalPages=" + totalPages +
                ", totalElements=" + totalElements +
                ", pageSize=" + pageSize +
                ", hasNext=" + hasNext +
                ", hasPrevious=" + hasPrevious +
                '}';
    }
}