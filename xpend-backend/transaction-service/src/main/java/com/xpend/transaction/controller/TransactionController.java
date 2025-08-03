package com.xpend.transaction.controller;

import com.xpend.transaction.dto.*;
import com.xpend.transaction.entity.Transaction;
import com.xpend.transaction.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class TransactionController {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionController.class);
    
    @Autowired
    private TransactionService transactionService;
    
    // ===============================
    // CRUD Operations
    // ===============================
    
    /**
     * Create a new transaction
     */
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionCreateRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        Long userId = extractUserId(authentication);
        String ipAddress = getClientIpAddress(httpRequest);
        
        logger.info("Creating transaction for user: {} from IP: {}", userId, ipAddress);
        
        TransactionResponse response = transactionService.createTransaction(request, userId);
        
        logger.info("Transaction created successfully: {} for user: {}", response.getId(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get transaction by ID
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @PathVariable UUID transactionId,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        logger.debug("Fetching transaction {} for user {}", transactionId, userId);
        
        TransactionResponse response = transactionService.getTransaction(transactionId, userId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update transaction
     */
    @PutMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable UUID transactionId,
            @Valid @RequestBody TransactionUpdateRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        Long userId = extractUserId(authentication);
        String ipAddress = getClientIpAddress(httpRequest);
        
        logger.info("Updating transaction {} for user: {} from IP: {}", transactionId, userId, ipAddress);
        
        TransactionResponse response = transactionService.updateTransaction(transactionId, request, userId);
        
        logger.info("Transaction updated successfully: {} for user: {}", transactionId, userId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete transaction
     */
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Map<String, String>> deleteTransaction(
            @PathVariable UUID transactionId,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        Long userId = extractUserId(authentication);
        String ipAddress = getClientIpAddress(httpRequest);
        
        logger.info("Deleting transaction {} for user: {} from IP: {}", transactionId, userId, ipAddress);
        
        transactionService.deleteTransaction(transactionId, userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Transaction deleted successfully");
        response.put("transactionId", transactionId.toString());
        
        logger.info("Transaction deleted successfully: {} for user: {}", transactionId, userId);
        return ResponseEntity.ok(response);
    }
    
    // ===============================
    // Search and Filtering
    // ===============================
    
    /**
     * Search transactions with advanced filtering
     */
    @GetMapping("/search")
    public ResponseEntity<PagedTransactionResponse> searchTransactions(
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) List<UUID> categoryIds,
            @RequestParam(required = false) List<String> paymentMethods,
            @RequestParam(required = false) List<String> sources,
            @RequestParam(required = false) String minAmount,
            @RequestParam(required = false) String maxAmount,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String dateRangePreset,
            @RequestParam(required = false) String descriptionKeyword,
            @RequestParam(required = false) String accountNameKeyword,
            @RequestParam(required = false) String notesKeyword,
            @RequestParam(required = false) UUID groupId,
            @RequestParam(required = false) Boolean isGroupTransaction,
            @RequestParam(required = false) String memberEmail,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        logger.debug("Searching transactions for user: {} with filters", userId);
        
        // Build search criteria
        TransactionSearchCriteria criteria = new TransactionSearchCriteria(userId);
        
        if (transactionType != null) {
            try {
                criteria.setTransactionType(Transaction.TransactionType.valueOf(transactionType.toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid transaction type: {}", transactionType);
            }
        }
        
        criteria.setCategoryIds(categoryIds);
        criteria.setPaymentMethods(paymentMethods);
        criteria.setSources(sources);
        
        if (minAmount != null) {
            try {
                criteria.setMinAmount(new java.math.BigDecimal(minAmount));
            } catch (NumberFormatException e) {
                logger.warn("Invalid minAmount: {}", minAmount);
            }
        }
        
        if (maxAmount != null) {
            try {
                criteria.setMaxAmount(new java.math.BigDecimal(maxAmount));
            } catch (NumberFormatException e) {
                logger.warn("Invalid maxAmount: {}", maxAmount);
            }
        }
        
        criteria.setFromDate(fromDate);
        criteria.setToDate(toDate);
        
        if (dateRangePreset != null) {
            try {
                criteria.setDateRangePreset(TransactionSearchCriteria.DateRangePreset.valueOf(dateRangePreset.toUpperCase()));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid date range preset: {}", dateRangePreset);
            }
        }
        
        criteria.setDescriptionKeyword(descriptionKeyword);
        criteria.setAccountNameKeyword(accountNameKeyword);
        criteria.setNotesKeyword(notesKeyword);
        criteria.setGroupId(groupId);
        criteria.setIsGroupTransaction(isGroupTransaction);
        criteria.setMemberEmail(memberEmail);
        criteria.setPage(page);
        criteria.setSize(size);
        criteria.setSortBy(sortBy);
        criteria.setSortDirection(sortDirection);
        
        PagedTransactionResponse response = transactionService.searchTransactions(criteria);
        
        logger.debug("Found {} transactions for user: {}", response.getTotalElements(), userId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all transactions for user (simplified endpoint)
     */
    @GetMapping
    public ResponseEntity<PagedTransactionResponse> getAllTransactions(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        logger.debug("Fetching all transactions for user: {}", userId);
        
        TransactionSearchCriteria criteria = new TransactionSearchCriteria(userId);
        criteria.setPage(page);
        criteria.setSize(size);
        criteria.setSortBy(sortBy);
        criteria.setSortDirection(sortDirection);
        
        PagedTransactionResponse response = transactionService.searchTransactions(criteria);
        
        return ResponseEntity.ok(response);
    }
    
    // ===============================
    // Summary and Analytics
    // ===============================
    
    /**
     * Get transaction summary for user
     */
    @GetMapping("/summary")
    public ResponseEntity<PagedTransactionResponse.TransactionSummary> getTransactionSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        logger.debug("Fetching transaction summary for user: {}", userId);
        
        // Default to current month if no dates provided
        if (fromDate == null && toDate == null) {
            LocalDate now = LocalDate.now();
            fromDate = now.withDayOfMonth(1);
            toDate = now;
        }
        
        PagedTransactionResponse.TransactionSummary summary = 
                transactionService.getTransactionSummary(userId, fromDate, toDate);
        
        return ResponseEntity.ok(summary);
    }
    
    /**
     * Get recent transactions
     */
    @GetMapping("/recent")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        logger.debug("Fetching {} recent transactions for user: {}", limit, userId);
        
        List<TransactionResponse> transactions = transactionService.getRecentTransactions(userId, limit);
        
        return ResponseEntity.ok(transactions);
    }
    
    /**
     * Get top expense categories
     */
    @GetMapping("/analytics/top-categories")
    public ResponseEntity<List<Map<String, Object>>> getTopExpenseCategories(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(defaultValue = "10") @Min(1) @Max(20) int limit,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        
        if (fromDate == null) {
            fromDate = LocalDate.now().minusMonths(1);
        }
        
        logger.debug("Fetching top {} expense categories for user: {} from {}", limit, userId, fromDate);
        
        List<Map<String, Object>> categories = transactionService.getTopExpenseCategories(userId, fromDate, limit);
        
        return ResponseEntity.ok(categories);
    }
    
    // ===============================
    // Bulk Operations
    // ===============================
    
    /**
     * Create multiple transactions in bulk
     */
    @PostMapping("/bulk")
    public ResponseEntity<BulkTransactionResponse> createTransactionsBulk(
            @Valid @RequestBody BulkTransactionRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        Long userId = extractUserId(authentication);
        String ipAddress = getClientIpAddress(httpRequest);
        
        logger.info("Creating {} transactions in bulk for user: {} from IP: {}", 
                   request.getTransactionCount(), userId, ipAddress);
        
        BulkTransactionResponse response = transactionService.createTransactionsBulk(request, userId);
        
        HttpStatus statusCode = response.isCompleteSuccess() ? HttpStatus.CREATED : 
                               response.isCompleteFailure() ? HttpStatus.BAD_REQUEST : 
                               HttpStatus.MULTI_STATUS;
        
        logger.info("Bulk transaction creation completed for user: {} - {} success, {} failures", 
                   userId, response.getSuccessCount(), response.getFailureCount());
        
        return ResponseEntity.status(statusCode).body(response);
    }
    
    /**
     * Delete multiple transactions in bulk
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<BulkTransactionResponse> deleteTransactionsBulk(
            @RequestBody List<UUID> transactionIds,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        Long userId = extractUserId(authentication);
        String ipAddress = getClientIpAddress(httpRequest);
        
        logger.info("Deleting {} transactions in bulk for user: {} from IP: {}", 
                   transactionIds.size(), userId, ipAddress);
        
        BulkTransactionResponse response = transactionService.deleteTransactionsBulk(transactionIds, userId);
        
        HttpStatus statusCode = response.isCompleteSuccess() ? HttpStatus.OK : 
                               response.isCompleteFailure() ? HttpStatus.BAD_REQUEST : 
                               HttpStatus.MULTI_STATUS;
        
        logger.info("Bulk transaction deletion completed for user: {} - {} success, {} failures", 
                   userId, response.getSuccessCount(), response.getFailureCount());
        
        return ResponseEntity.status(statusCode).body(response);
    }
    
    // ===============================
    // Health and Status
    // ===============================
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "transaction-service");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    // ===============================
    // Private Helper Methods
    // ===============================
    
    private Long extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new SecurityException("Authentication required");
        }
        
        // TODO: Extract user ID from JWT token or authentication principal
        // For now, assuming the principal contains the user ID
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = (Map<String, Object>) principal;
            Object userId = userInfo.get("userId");
            if (userId instanceof Number) {
                return ((Number) userId).longValue();
            }
        }
        
        // Fallback: try to parse principal as string
        try {
            return Long.parseLong(principal.toString());
        } catch (NumberFormatException e) {
            logger.error("Unable to extract user ID from authentication: {}", principal);
            throw new SecurityException("Invalid authentication");
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        // Check for X-Forwarded-For header (proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        // Check for X-Real-IP header (nginx)
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        // Check for CF-Connecting-IP header (Cloudflare)
        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (cfConnectingIp != null && !cfConnectingIp.isEmpty() && !"unknown".equalsIgnoreCase(cfConnectingIp)) {
            return cfConnectingIp;
        }
        
        // Fallback to remote address
        return request.getRemoteAddr();
    }
}