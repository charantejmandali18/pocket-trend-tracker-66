package com.xpend.transaction.service;

import com.xpend.transaction.dto.*;
import com.xpend.transaction.entity.Transaction;
import com.xpend.transaction.exception.*;
import com.xpend.transaction.repository.TransactionRepository;
import com.xpend.transaction.repository.TransactionSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TransactionService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private CustomerIntegrationService customerIntegrationService;
    
    @Autowired
    private CategoryIntegrationService categoryIntegrationService;
    
    @Autowired
    private TransactionAuditService auditService;
    
    @Value("${transaction.bulk-operations.max-batch-size:500}")
    private int maxBatchSize;
    
    @Value("${transaction.pagination.default-page-size:20}")
    private int defaultPageSize;
    
    @Value("${transaction.pagination.max-page-size:100}")
    private int maxPageSize;
    
    // ===============================
    // CRUD Operations
    // ===============================
    
    /**
     * Create a new transaction
     */
    public TransactionResponse createTransaction(TransactionCreateRequest request, Long userId) {
        logger.info("Creating transaction for user: {}", userId);
        
        // Validate user exists
        validateUser(userId);
        
        // Validate category access
        validateCategoryAccess(request.getCategoryId(), userId);
        
        // Validate group access if applicable
        if (request.getGroupId() != null) {
            validateGroupAccess(request.getGroupId(), userId);
        }
        
        // Create transaction entity
        Transaction transaction = mapToEntity(request, userId);
        
        // Save transaction
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Log audit event
        auditService.logTransactionCreated(savedTransaction, userId);
        
        logger.info("Transaction created successfully: {}", savedTransaction.getId());
        return mapToResponse(savedTransaction);
    }
    
    /**
     * Get transaction by ID with user authorization
     */
    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID transactionId, Long userId) {
        logger.debug("Fetching transaction {} for user {}", transactionId, userId);
        
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId, userId));
        
        return mapToResponse(transaction);
    }
    
    /**
     * Update transaction with user authorization
     */
    public TransactionResponse updateTransaction(UUID transactionId, TransactionUpdateRequest request, Long userId) {
        logger.info("Updating transaction {} for user {}", transactionId, userId);
        
        // Find existing transaction
        Transaction existingTransaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId, userId));
        
        // Store old values for audit
        Transaction oldTransaction = cloneTransaction(existingTransaction);
        
        // Apply updates
        applyUpdates(existingTransaction, request, userId);
        
        // Save updated transaction
        Transaction updatedTransaction = transactionRepository.save(existingTransaction);
        
        // Log audit event
        auditService.logTransactionUpdated(oldTransaction, updatedTransaction, userId, request.getUpdateReason());
        
        logger.info("Transaction updated successfully: {}", transactionId);
        return mapToResponse(updatedTransaction);
    }
    
    /**
     * Delete transaction with user authorization
     */
    public void deleteTransaction(UUID transactionId, Long userId) {
        logger.info("Deleting transaction {} for user {}", transactionId, userId);
        
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new TransactionNotFoundException(transactionId, userId));
        
        // Delete transaction
        transactionRepository.delete(transaction);
        
        // Log audit event
        auditService.logTransactionDeleted(transaction, userId);
        
        logger.info("Transaction deleted successfully: {}", transactionId);
    }
    
    // ===============================
    // Search and Filtering
    // ===============================
    
    /**
     * Search transactions with advanced filtering and pagination
     */
    @Transactional(readOnly = true)
    public PagedTransactionResponse searchTransactions(TransactionSearchCriteria criteria) {
        logger.debug("Searching transactions for user: {}", criteria.getUserId());
        
        // Ensure user ID is set for security
        if (criteria.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required for transaction search");
        }
        
        // Validate and adjust pagination parameters
        int pageSize = Math.min(criteria.getSize(), maxPageSize);
        if (pageSize <= 0) {
            pageSize = defaultPageSize;
        }
        
        // Create pageable with sorting
        Sort sort = createSort(criteria.getSortBy(), criteria.getSortDirection());
        Pageable pageable = PageRequest.of(criteria.getPage(), pageSize, sort);
        
        // Build specification for dynamic query
        Specification<Transaction> spec = TransactionSpecification.buildSpecification(criteria);
        
        // Execute search
        Page<Transaction> transactionPage = transactionRepository.findAll(spec, pageable);
        
        // Convert to response DTOs
        List<TransactionResponse> transactionResponses = transactionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        // Create paged response
        PagedTransactionResponse response = new PagedTransactionResponse(
                transactionResponses,
                transactionPage.getNumber(),
                transactionPage.getTotalPages(),
                transactionPage.getTotalElements(),
                transactionPage.getSize()
        );
        
        // Add summary if requested (for filtered results)
        if (!transactionResponses.isEmpty()) {
            response.setSummary(calculateSummary(criteria));
        }
        
        return response;
    }
    
    /**
     * Get user's transaction summary
     */
    @Transactional(readOnly = true)
    public PagedTransactionResponse.TransactionSummary getTransactionSummary(Long userId, LocalDate fromDate, LocalDate toDate) {
        logger.debug("Calculating transaction summary for user: {}", userId);
        
        List<Object[]> summaryData = transactionRepository.getSummaryByUserIdAndDateRange(userId, fromDate, toDate);
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        long incomeCount = 0;
        long expenseCount = 0;
        
        for (Object[] row : summaryData) {
            Transaction.TransactionType type = (Transaction.TransactionType) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            Long count = (Long) row[2];
            
            if (type == Transaction.TransactionType.INCOME) {
                totalIncome = amount;
                incomeCount = count;
            } else {
                totalExpenses = amount;
                expenseCount = count;
            }
        }
        
        return new PagedTransactionResponse.TransactionSummary(totalIncome, totalExpenses, incomeCount, expenseCount);
    }
    
    // ===============================
    // Bulk Operations
    // ===============================
    
    /**
     * Create multiple transactions in bulk
     */
    public BulkTransactionResponse createTransactionsBulk(BulkTransactionRequest request, Long userId) {
        logger.info("Creating {} transactions in bulk for user {}", request.getTransactionCount(), userId);
        
        if (request.getTransactionCount() > maxBatchSize) {
            throw new BulkTransactionException(
                "Batch size exceeds maximum allowed: " + maxBatchSize,
                request.getTransactionCount(), 0, request.getTransactionCount()
            );
        }
        
        BulkTransactionResponse response = new BulkTransactionResponse(request.getTransactionCount());
        
        for (int i = 0; i < request.getTransactions().size(); i++) {
            TransactionCreateRequest transactionRequest = request.getTransactions().get(i);
            
            try {
                TransactionResponse transactionResponse = createTransaction(transactionRequest, userId);
                response.addSuccessfulTransaction(transactionResponse);
                
            } catch (Exception e) {
                logger.warn("Failed to create transaction at index {}: {}", i, e.getMessage());
                response.addError(i, e.getClass().getSimpleName(), e.getMessage(), transactionRequest);
                
                // Stop processing if not configured to continue on error
                if (!request.isContinueOnError()) {
                    break;
                }
            }
        }
        
        // Log bulk operation audit
        auditService.logBulkTransactionCreated(response, userId, request.getOperationReason());
        
        logger.info("Bulk transaction creation completed: {} success, {} failures", 
                   response.getSuccessCount(), response.getFailureCount());
        
        return response;
    }
    
    /**
     * Delete multiple transactions in bulk
     */
    public BulkTransactionResponse deleteTransactionsBulk(List<UUID> transactionIds, Long userId) {
        logger.info("Deleting {} transactions in bulk for user {}", transactionIds.size(), userId);
        
        if (transactionIds.size() > maxBatchSize) {
            throw new BulkTransactionException(
                "Batch size exceeds maximum allowed: " + maxBatchSize,
                transactionIds.size(), 0, transactionIds.size()
            );
        }
        
        // Verify user owns all transactions
        long ownedCount = transactionRepository.countByUserIdAndIdIn(userId, transactionIds);
        if (ownedCount != transactionIds.size()) {
            throw new TransactionAccessDeniedException("Some transactions do not belong to user " + userId);
        }
        
        BulkTransactionResponse response = new BulkTransactionResponse(transactionIds.size());
        
        for (int i = 0; i < transactionIds.size(); i++) {
            UUID transactionId = transactionIds.get(i);
            
            try {
                deleteTransaction(transactionId, userId);
                response.addSuccessfulTransaction(new TransactionResponse()); // Placeholder for deleted transaction
                
            } catch (Exception e) {
                logger.warn("Failed to delete transaction {}: {}", transactionId, e.getMessage());
                response.addError(i, e.getClass().getSimpleName(), e.getMessage(), null);
            }
        }
        
        // Log bulk operation audit
        auditService.logBulkTransactionDeleted(response, userId, null);
        
        logger.info("Bulk transaction deletion completed: {} success, {} failures", 
                   response.getSuccessCount(), response.getFailureCount());
        
        return response;
    }
    
    // ===============================
    // Analytics and Reporting
    // ===============================
    
    /**
     * Get recent transactions for user
     */
    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentTransactions(Long userId, int limit) {
        logger.debug("Fetching {} recent transactions for user {}", limit, userId);
        
        Pageable pageable = PageRequest.of(0, Math.min(limit, 50));
        List<Transaction> transactions = transactionRepository.findRecentTransactionsByUserId(userId, pageable);
        
        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get top expense categories for user
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopExpenseCategories(Long userId, LocalDate fromDate, int limit) {
        logger.debug("Fetching top {} expense categories for user {}", limit, userId);
        
        Pageable pageable = PageRequest.of(0, Math.min(limit, 20));
        List<Object[]> results = transactionRepository.getTopExpenseCategoriesByUserId(userId, fromDate, pageable);
        
        return results.stream()
                .map(row -> {
                    Map<String, Object> category = new HashMap<>();
                    category.put("categoryId", row[0]);
                    category.put("totalAmount", row[1]);
                    // TODO: Add category name from category service
                    return category;
                })
                .collect(Collectors.toList());
    }
    
    // ===============================
    // Private Helper Methods
    // ===============================
    
    private void validateUser(Long userId) {
        if (!customerIntegrationService.userExists(userId)) {
            throw new TransactionValidationException("User not found: " + userId);
        }
    }
    
    private void validateCategoryAccess(UUID categoryId, Long userId) {
        if (!categoryIntegrationService.userHasAccessToCategory(categoryId, userId)) {
            throw new CategoryValidationException(categoryId, userId);
        }
    }
    
    private void validateGroupAccess(UUID groupId, Long userId) {
        // TODO: Implement group service integration
        logger.debug("Group validation not yet implemented for group: {}", groupId);
    }
    
    private Transaction mapToEntity(TransactionCreateRequest request, Long userId) {
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setCreatedBy(userId);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setCategoryId(request.getCategoryId());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setAccountName(request.getAccountName());
        transaction.setNotes(request.getNotes());
        transaction.setSource(request.getSource() != null ? request.getSource() : "manual");
        transaction.setGroupId(request.getGroupId());
        transaction.setMemberEmail(request.getMemberEmail());
        
        return transaction;
    }
    
    private TransactionResponse mapToResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getUserId(),
                transaction.getGroupId(),
                transaction.getCreatedBy(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getCategoryId(),
                transaction.getTransactionDate(),
                transaction.getPaymentMethod(),
                transaction.getAccountName(),
                transaction.getNotes(),
                transaction.getSource(),
                transaction.getMemberEmail(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }
    
    private void applyUpdates(Transaction transaction, TransactionUpdateRequest request, Long userId) {
        if (request.hasTransactionType()) {
            transaction.setTransactionType(request.getTransactionType());
        }
        if (request.hasAmount()) {
            transaction.setAmount(request.getAmount());
        }
        if (request.hasDescription()) {
            transaction.setDescription(request.getDescription());
        }
        if (request.hasCategoryId()) {
            validateCategoryAccess(request.getCategoryId(), userId);
            transaction.setCategoryId(request.getCategoryId());
        }
        if (request.hasTransactionDate()) {
            transaction.setTransactionDate(request.getTransactionDate());
        }
        if (request.hasPaymentMethod()) {
            transaction.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.hasAccountName()) {
            transaction.setAccountName(request.getAccountName());
        }
        if (request.hasNotes()) {
            transaction.setNotes(request.getNotes());
        }
        if (request.hasSource()) {
            transaction.setSource(request.getSource());
        }
        if (request.hasGroupId()) {
            if (request.getGroupId() != null) {
                validateGroupAccess(request.getGroupId(), userId);
            }
            transaction.setGroupId(request.getGroupId());
        }
        if (request.hasMemberEmail()) {
            transaction.setMemberEmail(request.getMemberEmail());
        }
    }
    
    private Transaction cloneTransaction(Transaction transaction) {
        Transaction clone = new Transaction();
        clone.setId(transaction.getId());
        clone.setUserId(transaction.getUserId());
        clone.setCreatedBy(transaction.getCreatedBy());
        clone.setTransactionType(transaction.getTransactionType());
        clone.setAmount(transaction.getAmount());
        clone.setDescription(transaction.getDescription());
        clone.setCategoryId(transaction.getCategoryId());
        clone.setTransactionDate(transaction.getTransactionDate());
        clone.setPaymentMethod(transaction.getPaymentMethod());
        clone.setAccountName(transaction.getAccountName());
        clone.setNotes(transaction.getNotes());
        clone.setSource(transaction.getSource());
        clone.setGroupId(transaction.getGroupId());
        clone.setMemberEmail(transaction.getMemberEmail());
        clone.setCreatedAt(transaction.getCreatedAt());
        clone.setUpdatedAt(transaction.getUpdatedAt());
        return clone;
    }
    
    private Sort createSort(String sortBy, String sortDirection) {
        // Validate sort field
        Set<String> allowedSortFields = Set.of(
                "transactionDate", "createdAt", "amount", "description", 
                "transactionType", "paymentMethod", "source"
        );
        
        String validatedSortBy = allowedSortFields.contains(sortBy) ? sortBy : "transactionDate";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? 
                Sort.Direction.ASC : Sort.Direction.DESC;
        
        return Sort.by(direction, validatedSortBy);
    }
    
    private PagedTransactionResponse.TransactionSummary calculateSummary(TransactionSearchCriteria criteria) {
        // Calculate summary for the filtered results
        LocalDate fromDate = criteria.getFromDate();
        LocalDate toDate = criteria.getToDate();
        
        if (fromDate == null && toDate == null && criteria.getDateRangePreset() == null) {
            // Default to current month if no date filter
            fromDate = LocalDate.now().withDayOfMonth(1);
            toDate = LocalDate.now();
        }
        
        return getTransactionSummary(criteria.getUserId(), fromDate, toDate);
    }
}