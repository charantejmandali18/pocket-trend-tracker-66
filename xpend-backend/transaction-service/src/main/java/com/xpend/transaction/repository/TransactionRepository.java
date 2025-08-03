package com.xpend.transaction.repository;

import com.xpend.transaction.entity.Transaction;
import com.xpend.transaction.entity.Transaction.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    
    // ===============================
    // Basic CRUD with User Isolation
    // ===============================
    
    /**
     * Find transaction by ID ensuring user owns it
     */
    @Query("SELECT t FROM Transaction t WHERE t.id = :id AND t.userId = :userId")
    Optional<Transaction> findByIdAndUserId(@Param("id") UUID id, @Param("userId") Long userId);
    
    /**
     * Find all transactions for a user with pagination
     */
    Page<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);
    
    /**
     * Count total transactions for a user
     */
    long countByUserId(Long userId);
    
    // ===============================
    // Transaction Type Queries
    // ===============================
    
    /**
     * Find transactions by user and type
     */
    Page<Transaction> findByUserIdAndTransactionTypeOrderByTransactionDateDesc(
            Long userId, TransactionType transactionType, Pageable pageable);
    
    /**
     * Count transactions by user and type
     */
    long countByUserIdAndTransactionType(Long userId, TransactionType transactionType);
    
    // ===============================
    // Date Range Queries
    // ===============================
    
    /**
     * Find transactions within date range
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate BETWEEN :fromDate AND :toDate " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);
    
    /**
     * Find transactions from a specific date onwards
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate >= :fromDate " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findByUserIdAndDateFrom(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            Pageable pageable);
    
    // ===============================
    // Category Queries
    // ===============================
    
    /**
     * Find transactions by category
     */
    Page<Transaction> findByUserIdAndCategoryIdOrderByTransactionDateDesc(
            Long userId, UUID categoryId, Pageable pageable);
    
    /**
     * Find transactions by multiple categories
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.categoryId IN :categoryIds " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findByUserIdAndCategoryIds(
            @Param("userId") Long userId,
            @Param("categoryIds") List<UUID> categoryIds,
            Pageable pageable);
    
    // ===============================
    // Group Transaction Queries
    // ===============================
    
    /**
     * Find group transactions
     */
    Page<Transaction> findByUserIdAndGroupIdOrderByTransactionDateDesc(
            Long userId, UUID groupId, Pageable pageable);
    
    /**
     * Find all group transactions for a user
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.groupId IS NOT NULL " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findGroupTransactionsByUserId(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find individual (non-group) transactions for a user
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.groupId IS NULL " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findIndividualTransactionsByUserId(@Param("userId") Long userId, Pageable pageable);
    
    // ===============================
    // Summary and Aggregation Queries
    // ===============================
    
    /**
     * Get total income for user
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.userId = :userId AND t.transactionType = 'INCOME'")
    BigDecimal getTotalIncomeByUserId(@Param("userId") Long userId);
    
    /**
     * Get total expenses for user
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.userId = :userId AND t.transactionType = 'EXPENSE'")
    BigDecimal getTotalExpensesByUserId(@Param("userId") Long userId);
    
    /**
     * Get income/expense summary for date range
     */
    @Query("SELECT t.transactionType as type, COALESCE(SUM(t.amount), 0) as total, COUNT(t) as count " +
           "FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY t.transactionType")
    List<Object[]> getSummaryByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
    
    /**
     * Get monthly summary for user
     */
    @Query("SELECT YEAR(t.transactionDate) as year, MONTH(t.transactionDate) as month, " +
           "t.transactionType as type, COALESCE(SUM(t.amount), 0) as total, COUNT(t) as count " +
           "FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate >= :fromDate " +
           "GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate), t.transactionType " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> getMonthlySummaryByUserId(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate);
    
    // ===============================
    // Search Queries
    // ===============================
    
    /**
     * Find transactions by payment method
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.paymentMethod IN :paymentMethods " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findByUserIdAndPaymentMethods(
            @Param("userId") Long userId,
            @Param("paymentMethods") List<String> paymentMethods,
            Pageable pageable);
    
    /**
     * Find transactions by source
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.source IN :sources " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<Transaction> findByUserIdAndSources(
            @Param("userId") Long userId,
            @Param("sources") List<String> sources,
            Pageable pageable);
    
    // ===============================
    // Recent Transactions
    // ===============================
    
    /**
     * Find recent transactions for user
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findRecentTransactionsByUserId(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * Find transactions created after a specific timestamp
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.createdAt > :timestamp " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findTransactionsCreatedAfter(
            @Param("userId") Long userId,
            @Param("timestamp") LocalDateTime timestamp);
    
    // ===============================
    // Bulk Operation Support
    // ===============================
    
    /**
     * Find transactions by IDs ensuring user owns them
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.id IN :ids")
    List<Transaction> findByUserIdAndIdIn(@Param("userId") Long userId, @Param("ids") List<UUID> ids);
    
    /**
     * Check if user owns all transactions
     */
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.id IN :ids")
    long countByUserIdAndIdIn(@Param("userId") Long userId, @Param("ids") List<UUID> ids);
    
    // ===============================
    // Statistics and Analytics
    // ===============================
    
    /**
     * Get top categories by spending
     */
    @Query("SELECT t.categoryId, COALESCE(SUM(t.amount), 0) as total " +
           "FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionType = 'EXPENSE' " +
           "AND t.transactionDate >= :fromDate " +
           "GROUP BY t.categoryId " +
           "ORDER BY total DESC")
    List<Object[]> getTopExpenseCategoriesByUserId(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            Pageable pageable);
    
    /**
     * Get spending trend by day
     */
    @Query("SELECT t.transactionDate, COALESCE(SUM(CASE WHEN t.transactionType = 'EXPENSE' THEN t.amount ELSE 0 END), 0) as expenses, " +
           "COALESCE(SUM(CASE WHEN t.transactionType = 'INCOME' THEN t.amount ELSE 0 END), 0) as income " +
           "FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate BETWEEN :fromDate AND :toDate " +
           "GROUP BY t.transactionDate " +
           "ORDER BY t.transactionDate")
    List<Object[]> getDailySpendingTrend(
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
    
    // ===============================
    // Dashboard Service Methods
    // ===============================
    
    /**
     * Find transactions by user and date range for dashboard
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndTransactionDateBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    /**
     * Find recent transactions ordered by creation date
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "ORDER BY t.createdAt DESC")
    List<Transaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}