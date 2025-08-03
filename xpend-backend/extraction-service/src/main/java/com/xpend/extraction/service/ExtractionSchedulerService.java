package com.xpend.extraction.service;

import com.xpend.extraction.entity.EmailAccount;
import com.xpend.extraction.entity.EmailProvider;
import com.xpend.extraction.entity.ExtractedTransaction;
import com.xpend.extraction.repository.EmailAccountRepository;
import com.xpend.extraction.repository.ExtractedTransactionRepository;
import com.xpend.extraction.util.EncryptionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Service
@Transactional
public class ExtractionSchedulerService {
    
    private static final Logger logger = LoggerFactory.getLogger(ExtractionSchedulerService.class);
    
    @Autowired
    private EmailAccountRepository emailAccountRepository;
    
    @Autowired
    private ExtractedTransactionRepository extractedTransactionRepository;
    
    @Autowired
    private GmailOAuthService gmailOAuthService;
    
    @Autowired
    private OutlookOAuthService outlookOAuthService;
    
    @Autowired
    private EmailParsingService emailParsingService;
    
    @Autowired
    private EncryptionUtil encryptionUtil;
    
    @Value("${extraction.batch-size:50}")
    private int batchSize;
    
    @Value("${extraction.max-emails-per-run:1000}")
    private int maxEmailsPerRun;
    
    @Value("${extraction.days-back:30}")
    private int daysBack;
    
    // Thread pool for parallel processing
    private final Executor extractionExecutor = Executors.newFixedThreadPool(5);
    
    /**
     * Scheduled task to extract transactions from emails
     * Runs every 5 minutes
     */
    @Scheduled(fixedDelayString = "${extraction.processing-interval:300000}")
    public void scheduleTransactionExtraction() {
        logger.info("Starting scheduled transaction extraction");
        
        try {
            // Get accounts that need syncing
            LocalDateTime cutoffTime = LocalDateTime.now().minus(5, ChronoUnit.MINUTES);
            List<EmailAccount> accountsToSync = emailAccountRepository.findAccountsNeedingSync(cutoffTime);
            
            logger.info("Found {} email accounts needing sync", accountsToSync.size());
            
            // Process each account in parallel
            CompletableFuture<?>[] futures = accountsToSync.stream()
                    .map(account -> CompletableFuture.runAsync(() -> processAccount(account), extractionExecutor))
                    .toArray(CompletableFuture[]::new);
            
            // Wait for all accounts to be processed
            CompletableFuture.allOf(futures).join();
            
            logger.info("Completed scheduled transaction extraction");
            
        } catch (Exception e) {
            logger.error("Error in scheduled transaction extraction", e);
        }
    }
    
    /**
     * Scheduled task to refresh expired tokens
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void refreshExpiredTokens() {
        logger.info("Starting token refresh process");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            List<EmailAccount> expiredAccounts = emailAccountRepository.findAccountsWithExpiredTokens(now);
            
            logger.info("Found {} accounts with expired tokens", expiredAccounts.size());
            
            for (EmailAccount account : expiredAccounts) {
                try {
                    refreshAccountToken(account);
                } catch (Exception e) {
                    logger.error("Failed to refresh token for account {}", account.getId(), e);
                }
            }
            
            logger.info("Completed token refresh process");
            
        } catch (Exception e) {
            logger.error("Error in token refresh process", e);
        }
    }
    
    private void processAccount(EmailAccount account) {
        try {
            logger.info("Processing account: {} ({})", account.getEmailAddress(), account.getProvider());
            
            // Check if token needs refresh
            if (account.needsRefresh()) {
                refreshAccountToken(account);
            }
            
            // Decrypt access token
            String accessToken = encryptionUtil.decryptString(account.getEncryptedAccessToken());
            if (accessToken == null) {
                logger.warn("Cannot decrypt access token for account {}", account.getId());
                return;
            }
            
            long emailsProcessed = 0;
            long transactionsExtracted = 0;
            
            // Process emails based on provider
            switch (account.getProvider()) {
                case GMAIL:
                    var result = processGmailAccount(account, accessToken);
                    emailsProcessed = result.emailsProcessed;
                    transactionsExtracted = result.transactionsExtracted;
                    break;
                    
                case OUTLOOK:
                    var outlookResult = processOutlookAccount(account, accessToken);
                    emailsProcessed = outlookResult.emailsProcessed;
                    transactionsExtracted = outlookResult.transactionsExtracted;
                    break;
                    
                default:
                    logger.warn("Unsupported email provider: {}", account.getProvider());
                    return;
            }
            
            // Update sync stats
            emailAccountRepository.updateSyncStats(
                    account.getId(),
                    LocalDateTime.now(),
                    emailsProcessed,
                    transactionsExtracted
            );
            
            logger.info("Completed processing account {}: emails={}, transactions={}", 
                       account.getId(), emailsProcessed, transactionsExtracted);
            
        } catch (Exception e) {
            logger.error("Failed to process account {}", account.getId(), e);
        }
    }
    
    private ProcessingResult processGmailAccount(EmailAccount account, String accessToken) {
        try {
            // Build query for transaction-related emails
            String query = buildGmailQuery(account);
            
            // Get recent emails
            List<String> messageIds = gmailOAuthService.getRecentEmails(accessToken, query, maxEmailsPerRun);
            
            long emailsProcessed = 0;
            long transactionsExtracted = 0;
            
            for (String messageId : messageIds) {
                try {
                    // Check if we already processed this message
                    if (extractedTransactionRepository.findByEmailAccountIdAndEmailMessageId(
                            account.getId(), messageId).isPresent()) {
                        continue;
                    }
                    
                    // Get email content
                    GmailOAuthService.EmailMessage email = gmailOAuthService.getEmailContent(accessToken, messageId);
                    emailsProcessed++;
                    
                    // Parse for transactions
                    ExtractedTransaction transaction = emailParsingService.parseEmailForTransaction(
                            account.getId(),
                            messageId,
                            email.getSubject(),
                            email.getSender(),
                            email.getBody(),
                            email.getInternalDate().toInstant().atZone(java.time.ZoneOffset.UTC).toLocalDateTime()
                    );
                    
                    if (transaction != null) {
                        extractedTransactionRepository.save(transaction);
                        transactionsExtracted++;
                        
                        logger.debug("Extracted transaction from Gmail: amount={}, merchant={}", 
                                   transaction.getAmount(), transaction.getMerchantName());
                    }
                    
                } catch (Exception e) {
                    logger.error("Failed to process Gmail message {}", messageId, e);
                }
            }
            
            return new ProcessingResult(emailsProcessed, transactionsExtracted);
            
        } catch (Exception e) {
            logger.error("Failed to process Gmail account {}", account.getId(), e);
            return new ProcessingResult(0, 0);
        }
    }
    
    private ProcessingResult processOutlookAccount(EmailAccount account, String accessToken) {
        try {
            // Build filter for transaction-related emails
            String filter = buildOutlookFilter(account);
            
            // Get recent emails
            List<String> messageIds = outlookOAuthService.getRecentEmails(accessToken, filter, maxEmailsPerRun);
            
            long emailsProcessed = 0;
            long transactionsExtracted = 0;
            
            for (String messageId : messageIds) {
                try {
                    // Check if we already processed this message
                    if (extractedTransactionRepository.findByEmailAccountIdAndEmailMessageId(
                            account.getId(), messageId).isPresent()) {
                        continue;
                    }
                    
                    // Get email content
                    OutlookOAuthService.OutlookEmailMessage email = outlookOAuthService.getEmailContent(accessToken, messageId);
                    emailsProcessed++;
                    
                    // Parse for transactions
                    ExtractedTransaction transaction = emailParsingService.parseEmailForTransaction(
                            account.getId(),
                            messageId,
                            email.getSubject(),
                            email.getSender(),
                            email.getBody(),
                            email.getReceivedDateTime()
                    );
                    
                    if (transaction != null) {
                        extractedTransactionRepository.save(transaction);
                        transactionsExtracted++;
                        
                        logger.debug("Extracted transaction from Outlook: amount={}, merchant={}", 
                                   transaction.getAmount(), transaction.getMerchantName());
                    }
                    
                } catch (Exception e) {
                    logger.error("Failed to process Outlook message {}", messageId, e);
                }
            }
            
            return new ProcessingResult(emailsProcessed, transactionsExtracted);
            
        } catch (Exception e) {
            logger.error("Failed to process Outlook account {}", account.getId(), e);
            return new ProcessingResult(0, 0);
        }
    }
    
    private String buildGmailQuery(EmailAccount account) {
        // Build Gmail search query for transaction emails
        LocalDateTime fromDate = account.getSyncFromDate() != null ? 
                account.getSyncFromDate() : LocalDateTime.now().minusDays(daysBack);
        
        StringBuilder query = new StringBuilder();
        query.append("after:").append(fromDate.toLocalDate().toString());
        
        // Add sender filters for banks and financial institutions
        query.append(" (");
        query.append("from:sbi.co.in OR from:hdfcbank.com OR from:icicibank.com OR ");
        query.append("from:axisbank.com OR from:kotak.com OR from:paytm.com OR ");
        query.append("from:phonepe.com OR from:razorpay.com OR ");
        query.append("subject:transaction OR subject:debited OR subject:credited OR ");
        query.append("subject:payment OR subject:upi");
        query.append(")");
        
        return query.toString();
    }
    
    private String buildOutlookFilter(EmailAccount account) {
        // Build Outlook filter for transaction emails
        LocalDateTime fromDate = account.getSyncFromDate() != null ? 
                account.getSyncFromDate() : LocalDateTime.now().minusDays(daysBack);
        
        return String.format("receivedDateTime ge %s and (contains(subject,'transaction') or contains(subject,'debited') or contains(subject,'credited') or contains(subject,'payment'))",
                fromDate.toString());
    }
    
    private void refreshAccountToken(EmailAccount account) {
        try {
            logger.info("Refreshing token for account: {}", account.getId());
            
            String refreshToken = encryptionUtil.decryptString(account.getEncryptedRefreshToken());
            if (refreshToken == null) {
                logger.warn("Cannot decrypt refresh token for account {}", account.getId());
                account.setIsActive(false);
                emailAccountRepository.save(account);
                return;
            }
            
            GmailOAuthService.TokenResponse newTokens;
            
            if (account.getProvider() == EmailProvider.GMAIL) {
                newTokens = gmailOAuthService.refreshAccessToken(refreshToken);
            } else if (account.getProvider() == EmailProvider.OUTLOOK) {
                newTokens = outlookOAuthService.refreshAccessToken(refreshToken);
            } else {
                logger.warn("Token refresh not supported for provider: {}", account.getProvider());
                return;
            }
            
            // Update tokens in database
            String encryptedAccessToken = encryptionUtil.encryptString(newTokens.getAccessToken());
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(newTokens.getExpiresIn());
            
            emailAccountRepository.updateAccessToken(account.getId(), encryptedAccessToken, expiresAt);
            
            logger.info("Successfully refreshed token for account: {}", account.getId());
            
        } catch (Exception e) {
            logger.error("Failed to refresh token for account {}", account.getId(), e);
            // Mark account as inactive if token refresh fails
            account.setIsActive(false);
            emailAccountRepository.save(account);
        }
    }
    
    private static class ProcessingResult {
        final long emailsProcessed;
        final long transactionsExtracted;
        
        ProcessingResult(long emailsProcessed, long transactionsExtracted) {
            this.emailsProcessed = emailsProcessed;
            this.transactionsExtracted = transactionsExtracted;
        }
    }
}