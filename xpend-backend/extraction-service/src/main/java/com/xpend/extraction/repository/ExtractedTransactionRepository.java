package com.xpend.extraction.repository;

import com.xpend.extraction.entity.ExtractedTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExtractedTransactionRepository extends JpaRepository<ExtractedTransaction, Long> {
    
    List<ExtractedTransaction> findByEmailAccountId(Long emailAccountId);
    
    List<ExtractedTransaction> findByEmailAccountIdAndIsProcessed(Long emailAccountId, Boolean isProcessed);
    
    Page<ExtractedTransaction> findByEmailAccountIdOrderByTransactionDateDesc(
            Long emailAccountId, Pageable pageable);
    
    Optional<ExtractedTransaction> findByEmailAccountIdAndEmailMessageId(
            Long emailAccountId, String emailMessageId);
    
    @Query("SELECT et FROM ExtractedTransaction et WHERE et.isProcessed = false AND " +
           "et.confidenceScore >= :minConfidence ORDER BY et.confidenceScore DESC, et.extractedAt ASC")
    List<ExtractedTransaction> findUnprocessedTransactionsWithHighConfidence(
            @Param("minConfidence") Double minConfidence);
    
    @Query("SELECT et FROM ExtractedTransaction et WHERE et.emailAccountId IN " +
           "(SELECT ea.id FROM EmailAccount ea WHERE ea.userId = :userId) " +
           "AND et.isProcessed = false ORDER BY et.transactionDate DESC")
    List<ExtractedTransaction> findUnprocessedTransactionsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT et FROM ExtractedTransaction et WHERE et.emailAccountId IN " +
           "(SELECT ea.id FROM EmailAccount ea WHERE ea.userId = :userId) " +
           "ORDER BY et.transactionDate DESC")
    Page<ExtractedTransaction> findTransactionsByUserId(@Param("userId") Long userId, Pageable pageable);
    
    @Modifying
    @Query("UPDATE ExtractedTransaction et SET et.isProcessed = true, " +
           "et.processedAt = :processedAt, et.createdTransactionId = :transactionId " +
           "WHERE et.id = :extractedTransactionId")
    void markAsProcessed(@Param("extractedTransactionId") Long extractedTransactionId,
                        @Param("processedAt") LocalDateTime processedAt,
                        @Param("transactionId") Long transactionId);
    
    @Modifying
    @Query("UPDATE ExtractedTransaction et SET et.isProcessed = false, " +
           "et.processedAt = null, et.createdTransactionId = null, " +
           "et.errorMessage = :errorMessage WHERE et.id = :extractedTransactionId")
    void markAsFailedToProcess(@Param("extractedTransactionId") Long extractedTransactionId,
                              @Param("errorMessage") String errorMessage);
    
    @Query("SELECT COUNT(et) FROM ExtractedTransaction et WHERE et.emailAccountId = :emailAccountId")
    long countByEmailAccountId(@Param("emailAccountId") Long emailAccountId);
    
    @Query("SELECT COUNT(et) FROM ExtractedTransaction et WHERE et.emailAccountId = :emailAccountId " +
           "AND et.isProcessed = false")
    long countUnprocessedByEmailAccountId(@Param("emailAccountId") Long emailAccountId);
    
    @Query("SELECT SUM(et.amount) FROM ExtractedTransaction et WHERE et.emailAccountId = :emailAccountId " +
           "AND et.isProcessed = true AND et.transactionDate >= :fromDate")
    BigDecimal getTotalProcessedAmountByEmailAccountSince(@Param("emailAccountId") Long emailAccountId,
                                                         @Param("fromDate") LocalDateTime fromDate);
    
    @Query("SELECT et FROM ExtractedTransaction et WHERE et.senderEmail = :senderEmail " +
           "AND et.transactionDate >= :fromDate ORDER BY et.transactionDate DESC")
    List<ExtractedTransaction> findBySenderEmailSince(@Param("senderEmail") String senderEmail,
                                                     @Param("fromDate") LocalDateTime fromDate);
    
    @Query("SELECT DISTINCT et.senderEmail FROM ExtractedTransaction et WHERE et.emailAccountId = :emailAccountId")
    List<String> findDistinctSenderEmailsByEmailAccountId(@Param("emailAccountId") Long emailAccountId);
    
    // Statistics queries
    @Query("SELECT COUNT(et) FROM ExtractedTransaction et WHERE et.extractedAt >= :fromDate")
    long countExtractedSince(@Param("fromDate") LocalDateTime fromDate);
    
    @Query("SELECT AVG(et.confidenceScore) FROM ExtractedTransaction et WHERE et.extractedAt >= :fromDate")
    Double getAverageConfidenceScoreSince(@Param("fromDate") LocalDateTime fromDate);
}