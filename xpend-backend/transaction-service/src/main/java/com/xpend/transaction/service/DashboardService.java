package com.xpend.transaction.service;

import com.xpend.transaction.entity.Transaction;
import com.xpend.transaction.entity.Transaction.TransactionType;
import com.xpend.transaction.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);

    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * Get complete dashboard overview with all calculations
     */
    public Map<String, Object> getDashboardOverview(Long userId, LocalDate startDate, LocalDate endDate) {
        logger.debug("Generating dashboard overview for user: {}", userId);

        // Default to current month if no dates provided
        if (startDate == null || endDate == null) {
            YearMonth currentMonth = YearMonth.now();
            startDate = currentMonth.atDay(1);
            endDate = currentMonth.atEndOfMonth();
        }

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(
                userId, startDate, endDate);

        Map<String, Object> overview = new HashMap<>();
        
        // Basic financial summary
        overview.put("financialSummary", calculateFinancialSummary(transactions));
        
        // Category breakdown
        overview.put("categoryBreakdown", calculateCategoryBreakdown(transactions));
        
        // Monthly projections
        overview.put("monthlyProjections", calculateMonthlyProjections(transactions, startDate, endDate));
        
        // Transaction trends
        overview.put("trends", calculateTransactionTrends(transactions));
        
        // Recent transactions (limited)
        overview.put("recentTransactions", getFormattedRecentTransactions(transactions, 5));

        logger.debug("Dashboard overview generated for user: {} with {} transactions", userId, transactions.size());
        return overview;
    }

    /**
     * Get financial summary with totals and calculations
     */
    public Map<String, Object> getFinancialSummary(Long userId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            YearMonth currentMonth = YearMonth.now();
            startDate = currentMonth.atDay(1);
            endDate = currentMonth.atEndOfMonth();
        }

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(
                userId, startDate, endDate);

        return calculateFinancialSummary(transactions);
    }

    /**
     * Get category breakdown with percentages and analytics
     */
    public Map<String, Object> getCategoryBreakdown(Long userId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            YearMonth currentMonth = YearMonth.now();
            startDate = currentMonth.atDay(1);
            endDate = currentMonth.atEndOfMonth();
        }

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(
                userId, startDate, endDate);

        return calculateCategoryBreakdown(transactions);
    }

    /**
     * Get monthly projections and budget analysis
     */
    public Map<String, Object> getMonthlyProjections(Long userId, LocalDate month) {
        YearMonth yearMonth = month != null ? YearMonth.from(month) : YearMonth.now();
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetween(
                userId, startDate, endDate);

        return calculateMonthlyProjections(transactions, startDate, endDate);
    }

    /**
     * Get recent transactions formatted for display
     */
    public Map<String, Object> getRecentTransactions(Long userId, int limit) {
        List<Transaction> recentTransactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("transactions", getFormattedRecentTransactions(recentTransactions, limit));
        result.put("total", recentTransactions.size());
        result.put("hasMore", recentTransactions.size() == limit);

        return result;
    }

    // Private calculation methods

    private Map<String, Object> calculateFinancialSummary(List<Transaction> transactions) {
        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netBalance = totalIncome.subtract(totalExpenses);
        BigDecimal savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0 
                ? netBalance.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalIncome", totalIncome);
        summary.put("totalExpenses", totalExpenses);
        summary.put("netBalance", netBalance);
        summary.put("savingsRate", savingsRate);
        summary.put("transactionCount", transactions.size());

        return summary;
    }

    private Map<String, Object> calculateCategoryBreakdown(List<Transaction> transactions) {
        Map<UUID, BigDecimal> expensesByCategory = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        Transaction::getCategoryId,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        BigDecimal totalExpenses = expensesByCategory.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> categoryData = expensesByCategory.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> categoryInfo = new HashMap<>();
                    categoryInfo.put("categoryId", entry.getKey());
                    categoryInfo.put("amount", entry.getValue());
                    categoryInfo.put("percentage", totalExpenses.compareTo(BigDecimal.ZERO) > 0 
                            ? entry.getValue().divide(totalExpenses, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                            : BigDecimal.ZERO);
                    categoryInfo.put("transactionCount", transactions.stream()
                            .filter(t -> t.getCategoryId().equals(entry.getKey()))
                            .count());
                    return categoryInfo;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("amount")).compareTo((BigDecimal) a.get("amount")))
                .collect(Collectors.toList());

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("categories", categoryData);
        breakdown.put("totalExpenses", totalExpenses);
        breakdown.put("topCategory", categoryData.isEmpty() ? null : categoryData.get(0));

        return breakdown;
    }

    private Map<String, Object> calculateMonthlyProjections(List<Transaction> transactions, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        int daysInMonth = endDate.getDayOfMonth();
        int daysPassed = today.isBefore(endDate) ? today.getDayOfMonth() : daysInMonth;
        int daysRemaining = Math.max(0, daysInMonth - daysPassed);

        BigDecimal totalExpenses = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dailyAverage = daysPassed > 0 
                ? totalExpenses.divide(BigDecimal.valueOf(daysPassed), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal projectedTotal = dailyAverage.multiply(BigDecimal.valueOf(daysInMonth));

        Map<String, Object> projections = new HashMap<>();
        projections.put("daysInMonth", daysInMonth);
        projections.put("daysPassed", daysPassed);
        projections.put("daysRemaining", daysRemaining);
        projections.put("currentExpenses", totalExpenses);
        projections.put("dailyAverage", dailyAverage);
        projections.put("projectedTotal", projectedTotal);
        projections.put("projectedRemaining", projectedTotal.subtract(totalExpenses));

        return projections;
    }

    private Map<String, Object> calculateTransactionTrends(List<Transaction> transactions) {
        // Group transactions by day for trend analysis
        Map<LocalDate, BigDecimal> dailyExpenses = transactions.stream()
                .filter(t -> t.getTransactionType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        Transaction::getTransactionDate,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        Map<String, Object> trends = new HashMap<>();
        trends.put("dailyExpenses", dailyExpenses);
        trends.put("averageDailySpending", dailyExpenses.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(1, dailyExpenses.size())), 2, RoundingMode.HALF_UP));

        return trends;
    }

    private List<Map<String, Object>> getFormattedRecentTransactions(List<Transaction> transactions, int limit) {
        return transactions.stream()
                .limit(limit)
                .map(transaction -> {
                    Map<String, Object> transactionData = new HashMap<>();
                    transactionData.put("id", transaction.getId());
                    transactionData.put("description", transaction.getDescription());
                    transactionData.put("amount", transaction.getAmount());
                    transactionData.put("transactionType", transaction.getTransactionType());
                    transactionData.put("transactionDate", transaction.getTransactionDate());
                    transactionData.put("categoryId", transaction.getCategoryId());
                    transactionData.put("paymentMethod", transaction.getPaymentMethod());
                    transactionData.put("createdAt", transaction.getCreatedAt());
                    return transactionData;
                })
                .collect(Collectors.toList());
    }
}