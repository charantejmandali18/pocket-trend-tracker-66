package com.xpend.extraction.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "extracted_transactions", indexes = {
    @Index(name = "idx_email_account_id", columnList = "email_account_id"),
    @Index(name = "idx_message_id", columnList = "email_message_id"),
    @Index(name = "idx_transaction_date", columnList = "transaction_date"),
    @Index(name = "idx_processed", columnList = "is_processed")
})
public class ExtractedTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "email_account_id", nullable = false)
    private Long emailAccountId;
    
    @Column(name = "email_message_id", nullable = false)
    private String emailMessageId;
    
    @Column(name = "email_subject")
    private String emailSubject;
    
    @Column(name = "sender_email")
    private String senderEmail;
    
    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;
    
    @Column(name = "transaction_type")
    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;
    
    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "currency", length = 3)
    private String currency = "INR";
    
    @Column(name = "merchant_name")
    private String merchantName;
    
    @Column(name = "account_number_last4")
    private String accountNumberLast4;
    
    @Column(name = "card_last4")
    private String cardLast4;
    
    @Column(name = "transaction_id")
    private String transactionId;
    
    @Column(name = "reference_number")
    private String referenceNumber;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "category_suggestion")
    private String categorySuggestion;
    
    @Column(name = "raw_email_content", columnDefinition = "TEXT")
    private String rawEmailContent;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Column(name = "is_processed", nullable = false)
    private Boolean isProcessed = false;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @Column(name = "created_transaction_id")
    private Long createdTransactionId;
    
    @Column(name = "error_message")
    private String errorMessage;
    
    @CreationTimestamp
    @Column(name = "extracted_at", nullable = false, updatable = false)
    private LocalDateTime extractedAt;
    
    // Constructors
    public ExtractedTransaction() {}
    
    public ExtractedTransaction(Long emailAccountId, String emailMessageId) {
        this.emailAccountId = emailAccountId;
        this.emailMessageId = emailMessageId;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getEmailAccountId() { return emailAccountId; }
    public void setEmailAccountId(Long emailAccountId) { this.emailAccountId = emailAccountId; }
    
    public String getEmailMessageId() { return emailMessageId; }
    public void setEmailMessageId(String emailMessageId) { this.emailMessageId = emailMessageId; }
    
    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }
    
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    
    public LocalDateTime getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDateTime transactionDate) { this.transactionDate = transactionDate; }
    
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
    
    public String getAccountNumberLast4() { return accountNumberLast4; }
    public void setAccountNumberLast4(String accountNumberLast4) { this.accountNumberLast4 = accountNumberLast4; }
    
    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategorySuggestion() { return categorySuggestion; }
    public void setCategorySuggestion(String categorySuggestion) { this.categorySuggestion = categorySuggestion; }
    
    public String getRawEmailContent() { return rawEmailContent; }
    public void setRawEmailContent(String rawEmailContent) { this.rawEmailContent = rawEmailContent; }
    
    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
    
    public Boolean getIsProcessed() { return isProcessed; }
    public void setIsProcessed(Boolean isProcessed) { this.isProcessed = isProcessed; }
    
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
    
    public Long getCreatedTransactionId() { return createdTransactionId; }
    public void setCreatedTransactionId(Long createdTransactionId) { this.createdTransactionId = createdTransactionId; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    
    public LocalDateTime getExtractedAt() { return extractedAt; }
    public void setExtractedAt(LocalDateTime extractedAt) { this.extractedAt = extractedAt; }
}

