package com.xpend.extraction.service;

import com.xpend.extraction.entity.ExtractedTransaction;
import com.xpend.extraction.entity.TransactionType;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailParsingService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailParsingService.class);
    
    // Bank domains for transaction detection
    private final List<String> bankDomains = Arrays.asList(
        "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
        "yesbank.in", "indusind.com", "pnb.co.in", "bankofbaroda.co.in", "canarabank.com",
        "unionbankofindia.co.in", "idfcfirstbank.com", "rbl.co.in", "sc.com", "citibank.co.in",
        "hsbc.co.in", "dbs.com", "americanexpress.com", "paytm.com", "phonepe.com",
        "gpay.com", "razorpay.com", "bharatpe.com", "cred.club"
    );
    
    // Common patterns for transaction extraction
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:rs\\.?|inr|₹)\\s*([0-9,]+(?:\\.[0-9]{2})?)", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern CARD_PATTERN = Pattern.compile(
        "(?:card|xxxx)\\s*(?:ending\\s*)?(?:with\\s*)?([0-9]{4})", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ACCOUNT_PATTERN = Pattern.compile(
        "(?:account|a/c)\\s*(?:no\\.?|number)?\\s*(?:ending\\s*)?(?:with\\s*)?(?:xxxx)?([0-9]{4})", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern TRANSACTION_ID_PATTERN = Pattern.compile(
        "(?:transaction|txn|ref|reference)\\s*(?:id|no\\.?|number)?:?\\s*([a-zA-Z0-9]+)", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern UPI_ID_PATTERN = Pattern.compile(
        "upi\\s*(?:id|ref)?:?\\s*([0-9]+)", 
        Pattern.CASE_INSENSITIVE
    );
    
    // Transaction type keywords
    private static final Map<TransactionType, List<String>> TRANSACTION_KEYWORDS = Map.of(
        TransactionType.DEBIT, Arrays.asList("debited", "debit", "spent", "purchase", "payment", "withdrawn"),
        TransactionType.CREDIT, Arrays.asList("credited", "credit", "received", "deposit", "refund", "cashback"),
        TransactionType.ATM_WITHDRAWAL, Arrays.asList("atm", "cash withdrawal", "withdrew"),
        TransactionType.ONLINE_PURCHASE, Arrays.asList("online", "ecommerce", "amazon", "flipkart", "swiggy", "zomato"),
        TransactionType.MOBILE_PAYMENT, Arrays.asList("upi", "paytm", "phonepe", "gpay", "bhim"),
        TransactionType.BILL_PAYMENT, Arrays.asList("bill payment", "electricity", "mobile recharge", "dth"),
        TransactionType.EMI_PAYMENT, Arrays.asList("emi", "loan", "installment"),
        TransactionType.SALARY_CREDIT, Arrays.asList("salary", "sal cr"),
        TransactionType.INTEREST_CREDIT, Arrays.asList("interest", "fd interest", "sb interest"),
        TransactionType.CHARGES, Arrays.asList("charges", "fee", "annual fee", "service charge")
    );
    
    // Category suggestions based on merchant patterns
    private static final Map<String, String> MERCHANT_CATEGORIES = Map.of(
        "amazon|flipkart|myntra|ajio", "Shopping",
        "swiggy|zomato|dominos|mcdonald", "Food & Dining",
        "uber|ola|metro|bus", "Transportation",
        "phonepe|paytm|gpay", "Digital Wallet",
        "netflix|spotify|prime", "Entertainment",
        "electricity|gas|water|mobile", "Utilities",
        "hospital|medical|pharmacy", "Healthcare",
        "petrol|fuel|hp|bharat", "Fuel",
        "grocery|supermarket|dmart", "Groceries"
    );
    
    public ExtractedTransaction parseEmailForTransaction(Long emailAccountId, String messageId, 
                                                        String subject, String sender, 
                                                        String emailBody, LocalDateTime receivedDate) {
        try {
            logger.debug("Parsing email for transaction: messageId={}, sender={}", messageId, sender);
            
            // Check if email is from a known bank or financial institution
            if (!isFinancialEmail(sender, subject)) {
                logger.debug("Email not from financial institution, skipping: {}", sender);
                return null;
            }
            
            // Clean and parse the email content
            String cleanContent = cleanEmailContent(emailBody);
            
            ExtractedTransaction transaction = new ExtractedTransaction(emailAccountId, messageId);
            transaction.setEmailSubject(subject);
            transaction.setSenderEmail(sender);
            transaction.setRawEmailContent(emailBody);
            
            // Extract transaction details
            BigDecimal amount = extractAmount(cleanContent);
            if (amount == null) {
                logger.debug("No amount found in email, skipping");
                return null;
            }
            transaction.setAmount(amount);
            
            // Determine transaction type
            TransactionType transactionType = determineTransactionType(cleanContent, subject);
            transaction.setTransactionType(transactionType);
            
            // Extract other details
            transaction.setMerchantName(extractMerchantName(cleanContent, subject));
            transaction.setAccountNumberLast4(extractAccountNumber(cleanContent));
            transaction.setCardLast4(extractCardNumber(cleanContent));
            transaction.setTransactionId(extractTransactionId(cleanContent));
            transaction.setReferenceNumber(extractReferenceNumber(cleanContent));
            transaction.setDescription(generateDescription(cleanContent, subject));
            transaction.setCategorySuggestion(suggestCategory(transaction.getMerchantName(), cleanContent));
            
            // Try to extract transaction date, fallback to email received date
            LocalDateTime transactionDate = extractTransactionDate(cleanContent);
            transaction.setTransactionDate(transactionDate != null ? transactionDate : receivedDate);
            
            // Calculate confidence score
            double confidenceScore = calculateConfidenceScore(transaction, cleanContent, sender);
            transaction.setConfidenceScore(confidenceScore);
            
            logger.info("Successfully parsed transaction: amount={}, type={}, confidence={}", 
                       amount, transactionType, confidenceScore);
            
            return transaction;
            
        } catch (Exception e) {
            logger.error("Failed to parse email for transaction: messageId={}", messageId, e);
            return null;
        }
    }
    
    private boolean isFinancialEmail(String sender, String subject) {
        if (sender == null) return false;
        
        String senderLower = sender.toLowerCase();
        String subjectLower = subject != null ? subject.toLowerCase() : "";
        
        // Check if sender domain is in bank domains list
        for (String domain : bankDomains) {
            if (senderLower.contains(domain.toLowerCase())) {
                return true;
            }
        }
        
        // Check for financial keywords in sender or subject
        String[] financialKeywords = {
            "bank", "card", "payment", "transaction", "debit", "credit", 
            "atm", "upi", "neft", "rtgs", "imps", "wallet", "paytm", "phonepe"
        };
        
        for (String keyword : financialKeywords) {
            if (senderLower.contains(keyword) || subjectLower.contains(keyword)) {
                return true;
            }
        }
        
        return false;
    }
    
    private String cleanEmailContent(String emailBody) {
        if (emailBody == null) return "";
        
        // Parse HTML content if present
        Document doc = Jsoup.parse(emailBody);
        String textContent = doc.text();
        
        // Remove excessive whitespace and normalize
        return textContent.replaceAll("\\s+", " ").trim();
    }
    
    private BigDecimal extractAmount(String content) {
        Matcher matcher = AMOUNT_PATTERN.matcher(content);
        if (matcher.find()) {
            try {
                String amountStr = matcher.group(1).replace(",", "");
                return new BigDecimal(amountStr);
            } catch (NumberFormatException e) {
                logger.debug("Failed to parse amount: {}", matcher.group(1));
            }
        }
        return null;
    }
    
    private TransactionType determineTransactionType(String content, String subject) {
        String combinedText = (content + " " + (subject != null ? subject : "")).toLowerCase();
        
        // Score each transaction type based on keyword matches
        Map<TransactionType, Integer> scores = new HashMap<>();
        
        for (Map.Entry<TransactionType, List<String>> entry : TRANSACTION_KEYWORDS.entrySet()) {
            int score = 0;
            for (String keyword : entry.getValue()) {
                if (combinedText.contains(keyword.toLowerCase())) {
                    score += keyword.length(); // Longer keywords get higher scores
                }
            }
            if (score > 0) {
                scores.put(entry.getKey(), score);
            }
        }
        
        // Return the type with highest score, default to DEBIT
        return scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(TransactionType.DEBIT);
    }
    
    private String extractMerchantName(String content, String subject) {
        // Try to extract merchant name from common patterns
        String[] patterns = {
            "(?:at|to|from)\\s+([A-Z][A-Za-z\\s]+?)\\s+(?:on|for|\\.|$)",
            "merchant[:\\s]+([A-Za-z0-9\\s]+?)(?:\\s|$)",
            "([A-Z][A-Za-z\\s]+?)\\s+transaction"
        };
        
        String combinedText = (subject != null ? subject : "") + " " + content;
        
        for (String patternStr : patterns) {
            Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(combinedText);
            if (matcher.find()) {
                String merchant = matcher.group(1).trim();
                if (merchant.length() > 3 && merchant.length() < 50) {
                    return merchant;
                }
            }
        }
        
        return null;
    }
    
    private String extractAccountNumber(String content) {
        Matcher matcher = ACCOUNT_PATTERN.matcher(content);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private String extractCardNumber(String content) {
        Matcher matcher = CARD_PATTERN.matcher(content);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private String extractTransactionId(String content) {
        Matcher matcher = TRANSACTION_ID_PATTERN.matcher(content);
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        // Try UPI ID pattern as well
        Matcher upiMatcher = UPI_ID_PATTERN.matcher(content);
        return upiMatcher.find() ? upiMatcher.group(1) : null;
    }
    
    private String extractReferenceNumber(String content) {
        // Similar to transaction ID but look for different keywords
        Pattern refPattern = Pattern.compile(
            "(?:rrn|ref no|reference number):?\\s*([a-zA-Z0-9]+)", 
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = refPattern.matcher(content);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private String generateDescription(String content, String subject) {
        // Generate a clean description from the email content
        String desc = subject != null ? subject : "";
        
        // Try to extract a meaningful description
        if (content.length() > 100) {
            // Take first meaningful sentence
            String[] sentences = content.split("\\. ");
            for (String sentence : sentences) {
                if (sentence.length() > 20 && sentence.length() < 200 && 
                    (sentence.toLowerCase().contains("transaction") || 
                     sentence.toLowerCase().contains("payment") ||
                     sentence.toLowerCase().contains("debited") ||
                     sentence.toLowerCase().contains("credited"))) {
                    desc = sentence.trim();
                    break;
                }
            }
        }
        
        return desc.length() > 500 ? desc.substring(0, 500) + "..." : desc;
    }
    
    private String suggestCategory(String merchantName, String content) {
        String searchText = ((merchantName != null ? merchantName : "") + " " + content).toLowerCase();
        
        for (Map.Entry<String, String> entry : MERCHANT_CATEGORIES.entrySet()) {
            Pattern pattern = Pattern.compile(entry.getKey(), Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(searchText).find()) {
                return entry.getValue();
            }
        }
        
        return "Other";
    }
    
    private LocalDateTime extractTransactionDate(String content) {
        // Common date patterns in transaction emails
        String[] datePatterns = {
            "\\b(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})\\b",
            "\\b(\\d{4})[/-](\\d{1,2})[/-](\\d{1,2})\\b",
            "\\b(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+(\\d{4})\\b"
        };
        
        for (String patternStr : datePatterns) {
            Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                try {
                    // This is simplified - in production, you'd want more robust date parsing
                    String dateStr = matcher.group(0);
                    // Add proper date parsing logic here
                    logger.debug("Found potential date: {}", dateStr);
                } catch (Exception e) {
                    logger.debug("Failed to parse date: {}", matcher.group(0));
                }
            }
        }
        
        return null; // Fallback to email received date
    }
    
    private double calculateConfidenceScore(ExtractedTransaction transaction, String content, String sender) {
        double score = 0.0;
        
        // Base score for having amount
        if (transaction.getAmount() != null) {
            score += 0.3;
        }
        
        // Score for sender being from known bank
        for (String domain : bankDomains) {
            if (sender.toLowerCase().contains(domain.toLowerCase())) {
                score += 0.2;
                break;
            }
        }
        
        // Score for having transaction ID
        if (transaction.getTransactionId() != null) {
            score += 0.15;
        }
        
        // Score for having account/card info
        if (transaction.getAccountNumberLast4() != null || transaction.getCardLast4() != null) {
            score += 0.15;
        }
        
        // Score for having merchant name
        if (transaction.getMerchantName() != null) {
            score += 0.1;
        }
        
        // Score for transaction type confidence
        if (transaction.getTransactionType() != null) {
            score += 0.1;
        }
        
        return Math.min(1.0, score);
    }
}