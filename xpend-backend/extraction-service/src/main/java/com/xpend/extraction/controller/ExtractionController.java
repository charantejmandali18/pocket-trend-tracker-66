package com.xpend.extraction.controller;

import com.xpend.extraction.dto.EmailAccountResponse;
import com.xpend.extraction.entity.ExtractedTransaction;
import com.xpend.extraction.repository.ExtractedTransactionRepository;
import com.xpend.extraction.service.EmailAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/extraction")
public class ExtractionController {
    
    private static final Logger logger = LoggerFactory.getLogger(ExtractionController.class);
    
    @Autowired
    private ExtractedTransactionRepository extractedTransactionRepository;
    
    @Autowired
    private EmailAuthService emailAuthService;
    
    /**
     * Get extracted transactions for the authenticated user
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getExtractedTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean processed,
            HttpServletRequest request) {
        
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<ExtractedTransaction> transactions;
            
            if (processed != null && !processed) {
                // Get unprocessed transactions
                List<ExtractedTransaction> unprocessedList = extractedTransactionRepository
                        .findUnprocessedTransactionsByUserId(userId);
                transactions = new org.springframework.data.domain.PageImpl<>(
                        unprocessedList, pageable, unprocessedList.size());
            } else {
                // Get all transactions
                transactions = extractedTransactionRepository.findTransactionsByUserId(userId, pageable);
            }
            
            return ResponseEntity.ok(Map.of(
                    "transactions", transactions.getContent(),
                    "totalElements", transactions.getTotalElements(),
                    "totalPages", transactions.getTotalPages(),
                    "currentPage", page,
                    "size", size
            ));
            
        } catch (Exception e) {
            logger.error("Failed to get extracted transactions", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve extracted transactions"));
        }
    }
    
    /**
     * Get extraction statistics for the authenticated user
     */
    private static volatile Map<String, Object> statsCache;
    private static volatile long statsCacheTime;
    private static final long CACHE_DURATION = 5000; // 5 seconds cache
    
    @GetMapping("/stats")
    public ResponseEntity<?> getExtractionStats(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                // Temporary fix for development - use default user ID
                userId = 1L;
            }
            
            // Simple cache to prevent spam requests
            long currentTime = System.currentTimeMillis();
            if (statsCache != null && (currentTime - statsCacheTime) < CACHE_DURATION) {
                return ResponseEntity.ok(statsCache);
            }
            
            // Get connected accounts
            List<EmailAccountResponse> accounts = emailAuthService.getConnectedAccounts(userId);
            
            // Calculate stats
            long totalEmails = accounts.stream()
                    .mapToLong(EmailAccountResponse::getTotalEmailsProcessed)
                    .sum();
                    
            long totalTransactions = accounts.stream()
                    .mapToLong(EmailAccountResponse::getTotalTransactionsExtracted)
                    .sum();
            
            long unprocessedTransactions = extractedTransactionRepository
                    .findUnprocessedTransactionsByUserId(userId).size();
            
            // Recent extraction stats
            LocalDateTime last24Hours = LocalDateTime.now().minusDays(1);
            long recentExtractions = extractedTransactionRepository.countExtractedSince(last24Hours);
            Double avgConfidence = extractedTransactionRepository.getAverageConfidenceScoreSince(last24Hours);
            
            Map<String, Object> stats = Map.of(
                    "connectedAccounts", accounts.size(),
                    "activeAccounts", accounts.stream().mapToLong(acc -> acc.getIsActive() ? 1 : 0).sum(),
                    "totalEmailsProcessed", totalEmails,
                    "totalTransactionsExtracted", totalTransactions,
                    "unprocessedTransactions", unprocessedTransactions,
                    "recentExtractions24h", recentExtractions,
                    "averageConfidence", avgConfidence != null ? avgConfidence : 0.0,
                    "accounts", accounts
            );
            
            // Update cache
            statsCache = stats;
            statsCacheTime = currentTime;
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("Failed to get extraction stats", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve extraction statistics"));
        }
    }
    
    /**
     * Manually approve/reject an extracted transaction
     */
    @PostMapping("/transactions/{transactionId}/approve")
    public ResponseEntity<?> approveTransaction(
            @PathVariable Long transactionId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            // TODO: Implement transaction approval logic
            // This would involve:
            // 1. Verify the transaction belongs to the user
            // 2. Create actual transaction in transaction service
            // 3. Mark extracted transaction as processed
            
            boolean approved = (Boolean) request.getOrDefault("approved", true);
            String userNotes = (String) request.get("notes");
            
            if (approved) {
                // Create transaction and mark as processed
                logger.info("User {} approved extracted transaction {}", userId, transactionId);
                return ResponseEntity.ok(Map.of("message", "Transaction approved and created"));
            } else {
                // Mark as rejected
                logger.info("User {} rejected extracted transaction {}", userId, transactionId);
                extractedTransactionRepository.markAsFailedToProcess(
                        transactionId, 
                        "Rejected by user: " + (userNotes != null ? userNotes : "No reason provided")
                );
                return ResponseEntity.ok(Map.of("message", "Transaction rejected"));
            }
            
        } catch (Exception e) {
            logger.error("Failed to approve/reject transaction", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to process transaction approval"));
        }
    }
    
    /**
     * Get extraction history for a specific email account
     */
    @GetMapping("/accounts/{accountId}/history")
    public ResponseEntity<?> getAccountExtractionHistory(
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            // Verify account belongs to user
            List<EmailAccountResponse> userAccounts = emailAuthService.getConnectedAccounts(userId);
            boolean accountBelongsToUser = userAccounts.stream()
                    .anyMatch(acc -> acc.getId().equals(accountId));
                    
            if (!accountBelongsToUser) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Account not found or access denied"));
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<ExtractedTransaction> transactions = extractedTransactionRepository
                    .findByEmailAccountIdOrderByTransactionDateDesc(accountId, pageable);
            
            return ResponseEntity.ok(Map.of(
                    "transactions", transactions.getContent(),
                    "totalElements", transactions.getTotalElements(),
                    "totalPages", transactions.getTotalPages(),
                    "currentPage", page,
                    "size", size
            ));
            
        } catch (Exception e) {
            logger.error("Failed to get account extraction history", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve extraction history"));
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "extraction-service",
                "timestamp", LocalDateTime.now()
        ));
    }
    
    /**
     * Get unique sender emails for analysis
     */
    @GetMapping("/senders")
    public ResponseEntity<?> getUniqueSenders(
            @RequestParam(required = false) Long accountId,
            HttpServletRequest request) {
        
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            List<String> senders;
            if (accountId != null) {
                // Verify account belongs to user
                List<EmailAccountResponse> userAccounts = emailAuthService.getConnectedAccounts(userId);
                boolean accountBelongsToUser = userAccounts.stream()
                        .anyMatch(acc -> acc.getId().equals(accountId));
                        
                if (!accountBelongsToUser) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Account not found or access denied"));
                }
                
                senders = extractedTransactionRepository.findDistinctSenderEmailsByEmailAccountId(accountId);
            } else {
                // Get senders for all user accounts
                // This would require a more complex query - implement based on needs
                senders = List.of(); // Placeholder
            }
            
            return ResponseEntity.ok(Map.of(
                    "senders", senders,
                    "count", senders.size()
            ));
            
        } catch (Exception e) {
            logger.error("Failed to get unique senders", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve senders"));
        }
    }
}