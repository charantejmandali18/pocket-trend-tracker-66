package com.xpend.extraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xpend.extraction.entity.ExtractedTransaction;
import com.xpend.extraction.entity.TransactionType;
import com.xpend.extraction.repository.ExtractedTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TransactionCreationService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionCreationService.class);
    
    @Autowired
    private ExtractedTransactionRepository extractedTransactionRepository;
    
    @Value("${services.transaction-service.url:http://localhost:8083}")
    private String transactionServiceUrl;
    
    @Value("${extraction.auto-create-threshold:0.8}")
    private double autoCreateThreshold;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Scheduled task to process extracted transactions and create actual transactions
     * Runs every 2 minutes
     */
    @Scheduled(fixedDelay = 120000) // 2 minutes
    public void processExtractedTransactions() {
        logger.info("Starting transaction creation process");
        
        try {
            // Get unprocessed transactions with high confidence
            List<ExtractedTransaction> candidates = extractedTransactionRepository
                    .findUnprocessedTransactionsWithHighConfidence(autoCreateThreshold);
            
            logger.info("Found {} high-confidence extracted transactions to process", candidates.size());
            
            for (ExtractedTransaction extracted : candidates) {
                try {
                    processExtractedTransaction(extracted);
                } catch (Exception e) {
                    logger.error("Failed to process extracted transaction {}", extracted.getId(), e);
                    
                    // Mark as failed with error message
                    extractedTransactionRepository.markAsFailedToProcess(
                            extracted.getId(), 
                            "Processing failed: " + e.getMessage()
                    );
                }
            }
            
            logger.info("Completed transaction creation process");
            
        } catch (Exception e) {
            logger.error("Error in transaction creation process", e);
        }
    }
    
    private void processExtractedTransaction(ExtractedTransaction extracted) {
        logger.debug("Processing extracted transaction: {}", extracted.getId());
        
        // Get user ID from email account
        Long userId = getUserIdFromEmailAccount(extracted.getEmailAccountId());
        if (userId == null) {
            throw new RuntimeException("Could not determine user ID for extracted transaction");
        }
        
        // Create transaction request
        TransactionCreateRequest request = buildTransactionRequest(extracted, userId);
        
        // Call transaction service to create transaction
        Long transactionId = createTransactionViaAPI(request, userId);
        
        // Mark as processed
        extractedTransactionRepository.markAsProcessed(
                extracted.getId(),
                LocalDateTime.now(),
                transactionId
        );
        
        // Update account balances if applicable
        updateAccountBalances(extracted, userId);
        
        logger.info("Successfully created transaction {} from extracted transaction {}", 
                   transactionId, extracted.getId());
    }
    
    private Long getUserIdFromEmailAccount(Long emailAccountId) {
        // This would typically be a join query, but since we have the structure separated,
        // we'll need to call the repository to get the user ID
        // For now, returning a mock value - in production, implement proper lookup
        return 1L; // TODO: Implement proper user ID lookup
    }
    
    private TransactionCreateRequest buildTransactionRequest(ExtractedTransaction extracted, Long userId) {
        TransactionCreateRequest request = new TransactionCreateRequest();
        
        // Basic transaction info
        request.setAmount(extracted.getAmount());
        request.setTransactionType(mapTransactionType(extracted.getTransactionType()));
        request.setDescription(buildDescription(extracted));
        request.setTransactionDate(extracted.getTransactionDate());
        
        // Required fields for transaction service
        request.setAccountName("Default Account"); // TODO: Map from extracted account info
        request.setPaymentMethod("EMAIL_EXTRACTED"); // Indicate this was extracted from email
        request.setCategoryId("550e8400-e29b-41d4-a716-446655440000"); // Default category UUID
        
        // Category and merchant info
        request.setCategoryName(extracted.getCategorySuggestion());
        request.setMerchantName(extracted.getMerchantName());
        
        // Additional metadata
        request.setNotes(buildNotes(extracted));
        request.setSource("api"); // Use 'api' as it's the closest to email extraction
        request.setTags(buildTags(extracted));
        
        return request;
    }
    
    private String mapTransactionType(TransactionType extractedType) {
        // Map extracted transaction type to transaction service type (uppercase as expected by API)
        return switch (extractedType) {
            case CREDIT, SALARY_CREDIT, INTEREST_CREDIT, DIVIDEND_CREDIT, REFUND -> "INCOME";
            case DEBIT, ATM_WITHDRAWAL, ONLINE_PURCHASE, MOBILE_PAYMENT, 
                 BILL_PAYMENT, EMI_PAYMENT, CHARGES, FEES -> "EXPENSE";
            case TRANSFER -> "EXPENSE"; // Map transfer to expense for now
            default -> "EXPENSE";
        };
    }
    
    private String buildDescription(ExtractedTransaction extracted) {
        StringBuilder desc = new StringBuilder();
        
        if (extracted.getMerchantName() != null) {
            desc.append("Payment to ").append(extracted.getMerchantName());
        } else if (extracted.getDescription() != null) {
            desc.append(extracted.getDescription());
        } else {
            desc.append("Transaction from email");
        }
        
        // Add transaction details
        if (extracted.getTransactionId() != null) {
            desc.append(" (ID: ").append(extracted.getTransactionId()).append(")");
        }
        
        return desc.toString();
    }
    
    private String buildNotes(ExtractedTransaction extracted) {
        StringBuilder notes = new StringBuilder();
        notes.append("Automatically extracted from email\n");
        notes.append("Sender: ").append(extracted.getSenderEmail()).append("\n");
        notes.append("Subject: ").append(extracted.getEmailSubject()).append("\n");
        notes.append("Confidence: ").append(String.format("%.2f", extracted.getConfidenceScore() * 100)).append("%\n");
        
        if (extracted.getAccountNumberLast4() != null) {
            notes.append("Account: ****").append(extracted.getAccountNumberLast4()).append("\n");
        }
        
        if (extracted.getCardLast4() != null) {
            notes.append("Card: ****").append(extracted.getCardLast4()).append("\n");
        }
        
        if (extracted.getReferenceNumber() != null) {
            notes.append("Reference: ").append(extracted.getReferenceNumber()).append("\n");
        }
        
        return notes.toString();
    }
    
    private String buildTags(ExtractedTransaction extracted) {
        StringBuilder tags = new StringBuilder();
        tags.append("email-extracted,");
        
        if (extracted.getTransactionType() != null) {
            tags.append(extracted.getTransactionType().name().toLowerCase()).append(",");
        }
        
        if (extracted.getSenderEmail() != null) {
            // Extract bank name from email domain
            String domain = extracted.getSenderEmail().substring(extracted.getSenderEmail().indexOf("@") + 1);
            String bankTag = extractBankTag(domain);
            if (bankTag != null) {
                tags.append(bankTag).append(",");
            }
        }
        
        // Remove trailing comma
        if (tags.length() > 0 && tags.charAt(tags.length() - 1) == ',') {
            tags.setLength(tags.length() - 1);
        }
        
        return tags.toString();
    }
    
    private String extractBankTag(String domain) {
        Map<String, String> bankDomains = Map.of(
            "sbi.co.in", "sbi",
            "hdfcbank.com", "hdfc",
            "icicibank.com", "icici",
            "axisbank.com", "axis",
            "kotak.com", "kotak",
            "paytm.com", "paytm",
            "phonepe.com", "phonepe"
        );
        
        return bankDomains.get(domain.toLowerCase());
    }
    
    private Long createTransactionViaAPI(TransactionCreateRequest request, Long userId) {
        try {
            String url = transactionServiceUrl + "/api/transactions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // TODO: Add proper JWT token for user authentication
            headers.set("Authorization", "Bearer " + generateServiceToken(userId));
            
            HttpEntity<TransactionCreateRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseData = objectMapper.readTree(response.getBody());
                return responseData.get("id").asLong();
            } else {
                throw new RuntimeException("Failed to create transaction: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to create transaction via API", e);
            throw new RuntimeException("API call failed", e);
        }
    }
    
    private String generateServiceToken(Long userId) {
        // Use the same JWT token that the development system uses
        // This token is valid for user ID 1 with proper roles
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJkZXZAZXhhbXBsZS5jb20iLCJmdWxsTmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlcyI6WyJVU0VSIiwiQURNSU4iXSwiaWF0IjoxNzU0MTMzODkwLCJleHAiOjE3NTY3MjU4OTB9.eLuiw7emKWVF1DgB4FPrHhqYKe40B55e5yzbXHZxoAI";
    }
    
    private void updateAccountBalances(ExtractedTransaction extracted, Long userId) {
        try {
            // If we can identify the specific account from card/account number
            if (extracted.getAccountNumberLast4() != null || extracted.getCardLast4() != null) {
                // TODO: Call account service to update balances
                // This would involve:
                // 1. Identifying the specific account based on last 4 digits
                // 2. Updating the account balance based on transaction type and amount
                // 3. Creating balance history record
                
                logger.debug("Account balance update would be triggered for account ending in: {}", 
                           extracted.getAccountNumberLast4() != null ? 
                           extracted.getAccountNumberLast4() : extracted.getCardLast4());
            }
            
        } catch (Exception e) {
            logger.error("Failed to update account balances for extracted transaction {}", 
                        extracted.getId(), e);
            // Don't fail the entire process if balance update fails
        }
    }
    
    // DTO for transaction creation request
    public static class TransactionCreateRequest {
        private java.math.BigDecimal amount;
        private String transactionType;
        private String description;
        private LocalDateTime transactionDate;
        private String categoryName;
        private String merchantName;
        private String notes;
        private String source;
        private String tags;
        
        // Required fields
        private String accountName;
        private String paymentMethod;
        private String categoryId;
        
        // Getters and setters
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        
        public String getTransactionType() { return transactionType; }
        public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public LocalDateTime getTransactionDate() { return transactionDate; }
        public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }
        
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        
        public String getMerchantName() { return merchantName; }
        public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public String getTags() { return tags; }
        public void setTags(String tags) { this.tags = tags; }
        
        public String getAccountName() { return accountName; }
        public void setAccountName(String accountName) { this.accountName = accountName; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        
        public String getCategoryId() { return categoryId; }
        public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    }
}