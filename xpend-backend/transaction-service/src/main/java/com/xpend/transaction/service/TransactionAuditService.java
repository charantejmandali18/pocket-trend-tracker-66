package com.xpend.transaction.service;

import com.xpend.transaction.dto.BulkTransactionResponse;
import com.xpend.transaction.entity.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for auditing transaction operations
 */
@Service
public class TransactionAuditService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionAuditService.class);
    private static final Logger auditLogger = LoggerFactory.getLogger("TRANSACTION_AUDIT");
    
    /**
     * Log transaction creation
     */
    public void logTransactionCreated(Transaction transaction, Long userId) {
        auditLogger.info("TRANSACTION_CREATED - User: {}, TransactionId: {}, Type: {}, Amount: [ENCRYPTED], Date: {}", 
                        userId, transaction.getId(), transaction.getTransactionType(), transaction.getTransactionDate());
        
        logger.debug("Transaction created audit logged for user {} and transaction {}", userId, transaction.getId());
    }
    
    /**
     * Log transaction update
     */
    public void logTransactionUpdated(Transaction oldTransaction, Transaction newTransaction, Long userId, String reason) {
        auditLogger.info("TRANSACTION_UPDATED - User: {}, TransactionId: {}, Reason: {}, UpdatedBy: {}", 
                        userId, newTransaction.getId(), reason != null ? reason : "Not provided", userId);
        
        // Log specific field changes (without exposing encrypted data)
        if (!oldTransaction.getTransactionType().equals(newTransaction.getTransactionType())) {
            auditLogger.info("FIELD_CHANGED - TransactionId: {}, Field: transactionType, OldValue: {}, NewValue: {}", 
                           newTransaction.getId(), oldTransaction.getTransactionType(), newTransaction.getTransactionType());
        }
        
        if (!oldTransaction.getCategoryId().equals(newTransaction.getCategoryId())) {
            auditLogger.info("FIELD_CHANGED - TransactionId: {}, Field: categoryId, OldValue: {}, NewValue: {}", 
                           newTransaction.getId(), oldTransaction.getCategoryId(), newTransaction.getCategoryId());
        }
        
        if (!oldTransaction.getTransactionDate().equals(newTransaction.getTransactionDate())) {
            auditLogger.info("FIELD_CHANGED - TransactionId: {}, Field: transactionDate, OldValue: {}, NewValue: {}", 
                           newTransaction.getId(), oldTransaction.getTransactionDate(), newTransaction.getTransactionDate());
        }
        
        if (!oldTransaction.getPaymentMethod().equals(newTransaction.getPaymentMethod())) {
            auditLogger.info("FIELD_CHANGED - TransactionId: {}, Field: paymentMethod, OldValue: {}, NewValue: {}", 
                           newTransaction.getId(), oldTransaction.getPaymentMethod(), newTransaction.getPaymentMethod());
        }
        
        // Note: We don't log encrypted field changes (amount, description, accountName, notes) for security
        
        logger.debug("Transaction updated audit logged for user {} and transaction {}", userId, newTransaction.getId());
    }
    
    /**
     * Log transaction deletion
     */
    public void logTransactionDeleted(Transaction transaction, Long userId) {
        auditLogger.info("TRANSACTION_DELETED - User: {}, TransactionId: {}, Type: {}, Date: {}, DeletedBy: {}", 
                        userId, transaction.getId(), transaction.getTransactionType(), 
                        transaction.getTransactionDate(), userId);
        
        logger.debug("Transaction deleted audit logged for user {} and transaction {}", userId, transaction.getId());
    }
    
    /**
     * Log bulk transaction creation
     */
    public void logBulkTransactionCreated(BulkTransactionResponse response, Long userId, String reason) {
        auditLogger.info("BULK_TRANSACTION_CREATED - User: {}, TotalRequested: {}, SuccessCount: {}, FailureCount: {}, Reason: {}", 
                        userId, response.getTotalRequested(), response.getSuccessCount(), 
                        response.getFailureCount(), reason != null ? reason : "Not provided");
        
        if (response.isHasErrors()) {
            auditLogger.warn("BULK_OPERATION_ERRORS - User: {}, ErrorCount: {}, SuccessRate: {:.2f}%", 
                           userId, response.getFailureCount(), response.getSuccessRate() * 100);
        }
        
        logger.debug("Bulk transaction creation audit logged for user {}", userId);
    }
    
    /**
     * Log bulk transaction deletion
     */
    public void logBulkTransactionDeleted(BulkTransactionResponse response, Long userId, String reason) {
        auditLogger.info("BULK_TRANSACTION_DELETED - User: {}, TotalRequested: {}, SuccessCount: {}, FailureCount: {}, Reason: {}", 
                        userId, response.getTotalRequested(), response.getSuccessCount(), 
                        response.getFailureCount(), reason != null ? reason : "Not provided");
        
        if (response.isHasErrors()) {
            auditLogger.warn("BULK_DELETE_ERRORS - User: {}, ErrorCount: {}, SuccessRate: {:.2f}%", 
                           userId, response.getFailureCount(), response.getSuccessRate() * 100);
        }
        
        logger.debug("Bulk transaction deletion audit logged for user {}", userId);
    }
    
    /**
     * Log transaction search/access
     */
    public void logTransactionAccessed(Long userId, String searchCriteria, int resultCount) {
        auditLogger.info("TRANSACTIONS_ACCESSED - User: {}, SearchCriteria: {}, ResultCount: {}", 
                        userId, searchCriteria, resultCount);
        
        logger.debug("Transaction access audit logged for user {}", userId);
    }
    
    /**
     * Log security violation
     */
    public void logSecurityViolation(Long userId, String operation, String details) {
        auditLogger.warn("SECURITY_VIOLATION - User: {}, Operation: {}, Details: {}", userId, operation, details);
        
        logger.warn("Security violation logged for user {}: {} - {}", userId, operation, details);
    }
    
    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(Long userId, String activity, String details) {
        auditLogger.warn("SUSPICIOUS_ACTIVITY - User: {}, Activity: {}, Details: {}", userId, activity, details);
        
        logger.warn("Suspicious activity logged for user {}: {} - {}", userId, activity, details);
    }
    
    /**
     * Log data access for compliance
     */
    public void logDataAccess(Long userId, String dataType, String purpose) {
        auditLogger.info("DATA_ACCESS - User: {}, DataType: {}, Purpose: {}", userId, dataType, purpose);
        
        logger.debug("Data access audit logged for user {}: {} for {}", userId, dataType, purpose);
    }
    
    /**
     * Log failed operations
     */
    public void logOperationFailed(Long userId, String operation, String error) {
        auditLogger.warn("OPERATION_FAILED - User: {}, Operation: {}, Error: {}", userId, operation, error);
        
        logger.debug("Failed operation audit logged for user {}: {} - {}", userId, operation, error);
    }
    
    /**
     * Log performance metrics
     */
    public void logPerformanceMetric(String operation, long duration, int recordCount) {
        auditLogger.info("PERFORMANCE_METRIC - Operation: {}, Duration: {}ms, RecordCount: {}", 
                        operation, duration, recordCount);
        
        logger.debug("Performance metric logged: {} took {}ms for {} records", operation, duration, recordCount);
    }
}