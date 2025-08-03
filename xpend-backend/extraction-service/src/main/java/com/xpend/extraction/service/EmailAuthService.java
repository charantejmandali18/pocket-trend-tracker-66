package com.xpend.extraction.service;

import com.xpend.extraction.dto.EmailAccountResponse;
import com.xpend.extraction.entity.EmailAccount;
import com.xpend.extraction.entity.EmailProvider;
import com.xpend.extraction.repository.EmailAccountRepository;
import com.xpend.extraction.util.EncryptionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmailAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailAuthService.class);
    
    @Autowired
    private EmailAccountRepository emailAccountRepository;
    
    @Autowired
    private EncryptionUtil encryptionUtil;
    
    @Autowired
    private GmailOAuthService gmailOAuthService;
    
    @Autowired
    private OutlookOAuthService outlookOAuthService;
    
    @Value("${oauth.gmail.client-id}")
    private String gmailClientId;
    
    @Value("${oauth.outlook.client-id}")
    private String outlookClientId;
    
    // Store OAuth state for security - in production, use Redis or database
    private final ConcurrentHashMap<String, Long> oauthStateMap = new ConcurrentHashMap<>();
    
    /**
     * Initiate Gmail OAuth flow
     */
    public String initiateGmailAuth(Long userId) {
        try {
            String state = EncryptionUtil.generateSecureRandomString(32);
            oauthStateMap.put(state, userId);
            
            // Clean up old states (prevent memory leak)
            if (oauthStateMap.size() > 1000) {
                cleanupOldStates();
            }
            
            String authUrl = gmailOAuthService.getAuthorizationUrl(state);
            logger.info("Generated Gmail auth URL for user: {}", userId);
            
            return authUrl;
            
        } catch (Exception e) {
            logger.error("Failed to initiate Gmail auth for user: {}", userId, e);
            throw new RuntimeException("Failed to initiate Gmail authentication", e);
        }
    }
    
    /**
     * Initiate Outlook OAuth flow
     */
    public String initiateOutlookAuth(Long userId) {
        try {
            String state = EncryptionUtil.generateSecureRandomString(32);
            oauthStateMap.put(state, userId);
            
            // Clean up old states (prevent memory leak)
            if (oauthStateMap.size() > 1000) {
                cleanupOldStates();
            }
            
            String authUrl = outlookOAuthService.getAuthorizationUrl(state);
            logger.info("Generated Outlook auth URL for user: {}", userId);
            
            return authUrl;
            
        } catch (Exception e) {
            logger.error("Failed to initiate Outlook auth for user: {}", userId, e);
            throw new RuntimeException("Failed to initiate Outlook authentication", e);
        }
    }
    
    /**
     * Get Gmail tokens for debug purposes (without storing in database)
     */
    public DebugTokenResponse getGmailTokensForDebug(String code, String state) {
        try {
            Long userId = oauthStateMap.remove(state);
            if (userId == null) {
                throw new RuntimeException("Invalid or expired OAuth state");
            }
            
            // Exchange code for tokens
            var tokenResponse = gmailOAuthService.exchangeCodeForTokens(code);
            
            // Get user email from Gmail API
            String emailAddress = gmailOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            logger.info("Successfully got Gmail tokens for debug - User: {}, Email: {}", userId, emailAddress);
            
            return new DebugTokenResponse(
                emailAddress,
                tokenResponse.getAccessToken(),
                tokenResponse.getRefreshToken(),
                tokenResponse.getExpiresIn()
            );
            
        } catch (Exception e) {
            logger.error("Failed to get Gmail tokens for debug", e);
            throw new RuntimeException("Failed to get Gmail tokens: " + e.getMessage(), e);
        }
    }

    /**
     * Handle Gmail OAuth callback
     */
    public EmailAccountResponse handleGmailCallback(String code, String state) {
        try {
            Long userId = oauthStateMap.remove(state);
            if (userId == null) {
                throw new RuntimeException("Invalid or expired OAuth state");
            }
            
            // Exchange code for tokens
            var tokenResponse = gmailOAuthService.exchangeCodeForTokens(code);
            
            // Get user email from Gmail API
            String emailAddress = gmailOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            // Check if account already exists
            Optional<EmailAccount> existingAccount = emailAccountRepository
                    .findByUserIdAndProviderAndEmailAddress(userId, EmailProvider.GMAIL, emailAddress);
            
            EmailAccount emailAccount;
            if (existingAccount.isPresent()) {
                // Update existing account
                emailAccount = existingAccount.get();
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(tokenResponse.getAccessToken()));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(tokenResponse.getRefreshToken()));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                emailAccount.setIsActive(true);
                logger.info("Updated existing Gmail account for user: {}", userId);
            } else {
                // Create new account
                emailAccount = new EmailAccount(userId, EmailProvider.GMAIL, emailAddress);
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(tokenResponse.getAccessToken()));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(tokenResponse.getRefreshToken()));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                emailAccount.setSyncFromDate(LocalDateTime.now().minusDays(30)); // Sync last 30 days
                logger.info("Created new Gmail account for user: {}", userId);
            }
            
            emailAccount = emailAccountRepository.save(emailAccount);
            
            return mapToResponse(emailAccount);
            
        } catch (Exception e) {
            logger.error("Failed to handle Gmail callback", e);
            throw new RuntimeException("Failed to complete Gmail authentication", e);
        }
    }
    
    /**
     * Save Gmail account directly (for frontend OAuth flow)
     */
    public EmailAccountResponse saveGmailAccount(Long userId, String emailAddress, 
                                               String accessToken, String refreshToken, int expiresIn) {
        try {
            // Check if account already exists
            Optional<EmailAccount> existingAccount = emailAccountRepository
                    .findByUserIdAndProviderAndEmailAddress(userId, EmailProvider.GMAIL, emailAddress);
            
            EmailAccount emailAccount;
            if (existingAccount.isPresent()) {
                // Update existing account
                emailAccount = existingAccount.get();
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(accessToken));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(refreshToken));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                emailAccount.setIsActive(true);
                logger.info("Updated existing Gmail account for user: {}", userId);
            } else {
                // Create new account
                emailAccount = new EmailAccount(userId, EmailProvider.GMAIL, emailAddress);
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(accessToken));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(refreshToken));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                emailAccount.setSyncFromDate(LocalDateTime.now().minusDays(30)); // Sync last 30 days
                logger.info("Created new Gmail account for user: {}", userId);
            }
            
            emailAccount = emailAccountRepository.save(emailAccount);
            logger.info("Successfully saved Gmail account {} for user {}", emailAddress, userId);
            
            return mapToResponse(emailAccount);
            
        } catch (Exception e) {
            logger.error("Failed to save Gmail account", e);
            throw new RuntimeException("Failed to save Gmail account", e);
        }
    }
    
    /**
     * Handle Outlook OAuth callback
     */
    public EmailAccountResponse handleOutlookCallback(String code, String state) {
        try {
            Long userId = oauthStateMap.remove(state);
            if (userId == null) {
                throw new RuntimeException("Invalid or expired OAuth state");
            }
            
            // Exchange code for tokens
            var tokenResponse = outlookOAuthService.exchangeCodeForTokens(code);
            
            // Get user email from Microsoft Graph API
            String emailAddress = outlookOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            // Check if account already exists
            Optional<EmailAccount> existingAccount = emailAccountRepository
                    .findByUserIdAndProviderAndEmailAddress(userId, EmailProvider.OUTLOOK, emailAddress);
            
            EmailAccount emailAccount;
            if (existingAccount.isPresent()) {
                // Update existing account
                emailAccount = existingAccount.get();
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(tokenResponse.getAccessToken()));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(tokenResponse.getRefreshToken()));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                emailAccount.setIsActive(true);
                logger.info("Updated existing Outlook account for user: {}", userId);
            } else {
                // Create new account
                emailAccount = new EmailAccount(userId, EmailProvider.OUTLOOK, emailAddress);
                emailAccount.setEncryptedAccessToken(encryptionUtil.encryptString(tokenResponse.getAccessToken()));
                emailAccount.setEncryptedRefreshToken(encryptionUtil.encryptString(tokenResponse.getRefreshToken()));
                emailAccount.setTokenExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresIn()));
                emailAccount.setSyncFromDate(LocalDateTime.now().minusDays(30)); // Sync last 30 days
                logger.info("Created new Outlook account for user: {}", userId);
            }
            
            emailAccount = emailAccountRepository.save(emailAccount);
            
            return mapToResponse(emailAccount);
            
        } catch (Exception e) {
            logger.error("Failed to handle Outlook callback", e);
            throw new RuntimeException("Failed to complete Outlook authentication", e);
        }
    }
    
    /**
     * Get connected email accounts for a user
     */
    public List<EmailAccountResponse> getConnectedAccounts(Long userId) {
        List<EmailAccount> accounts = emailAccountRepository.findByUserId(userId);
        return accounts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Disconnect an email account
     */
    public boolean disconnectAccount(Long userId, Long accountId) {
        Optional<EmailAccount> accountOpt = emailAccountRepository.findById(accountId);
        
        if (accountOpt.isPresent() && accountOpt.get().getUserId().equals(userId)) {
            EmailAccount account = accountOpt.get();
            account.setIsActive(false);
            account.setEncryptedAccessToken(null);
            account.setEncryptedRefreshToken(null);
            emailAccountRepository.save(account);
            
            logger.info("Disconnected email account {} for user: {}", accountId, userId);
            return true;
        }
        
        return false;
    }
    
    /**
     * Trigger manual sync for an email account
     */
    public boolean triggerManualSync(Long userId, Long accountId) {
        Optional<EmailAccount> accountOpt = emailAccountRepository.findById(accountId);
        
        if (accountOpt.isPresent() && accountOpt.get().getUserId().equals(userId)) {
            EmailAccount account = accountOpt.get();
            if (account.getIsActive()) {
                // TODO: Add to sync queue or trigger immediate sync
                logger.info("Manual sync triggered for account {} by user: {}", accountId, userId);
                return true;
            }
        }
        
        return false;
    }
    
    private EmailAccountResponse mapToResponse(EmailAccount account) {
        return new EmailAccountResponse(
                account.getId(),
                account.getProvider(),
                account.getEmailAddress(),
                account.getIsActive(),
                account.getLastSyncAt(),
                account.getTokenExpiresAt(),
                account.getSyncFromDate(),
                account.getTotalEmailsProcessed(),
                account.getTotalTransactionsExtracted(),
                account.getCreatedAt()
        );
    }
    
    private void cleanupOldStates() {
        // In production, implement proper cleanup with timestamps
        // For now, just clear half the map when it gets too large
        int currentSize = oauthStateMap.size();
        oauthStateMap.entrySet().removeIf(entry -> Math.random() < 0.5);
        logger.debug("Cleaned up OAuth states: {} -> {}", currentSize, oauthStateMap.size());
    }

    /**
     * Debug token response class
     */
    public static class DebugTokenResponse {
        private final String email;
        private final String accessToken;
        private final String refreshToken;
        private final int expiresIn;

        public DebugTokenResponse(String email, String accessToken, String refreshToken, int expiresIn) {
            this.email = email;
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
        }

        public String getEmail() { return email; }
        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public int getExpiresIn() { return expiresIn; }
    }
}