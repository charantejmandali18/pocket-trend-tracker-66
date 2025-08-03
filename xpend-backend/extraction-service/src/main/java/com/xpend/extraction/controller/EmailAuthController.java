package com.xpend.extraction.controller;

import com.xpend.extraction.dto.EmailAccountResponse;
import com.xpend.extraction.service.EmailAuthService;
import com.xpend.extraction.service.GmailOAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email-auth")
public class EmailAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailAuthController.class);
    
    @Autowired
    private EmailAuthService emailAuthService;
    
    @Autowired
    private GmailOAuthService gmailOAuthService;
    
    /**
     * Exchange OAuth code for tokens (working endpoint)
     */
    @PostMapping("/gmail/token")  
    public ResponseEntity<?> gmailTokenExchange(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            String state = request.get("state");
            
            logger.info("Token exchange endpoint called with code: {}", 
                       code != null ? code.substring(0, Math.min(10, code.length())) + "..." : "null");
            
            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
            }
            
            // Get tokens directly without user validation for frontend flow
            var tokenResponse = gmailOAuthService.exchangeCodeForTokens(code);
            
            // Get user email
            String emailAddress = gmailOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            logger.info("Successfully exchanged tokens for email: {}", emailAddress);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "email", emailAddress,
                "access_token", tokenResponse.getAccessToken(),
                "refresh_token", tokenResponse.getRefreshToken() != null ? tokenResponse.getRefreshToken() : "",
                "expires_in", tokenResponse.getExpiresIn(),
                "token_type", "Bearer",
                "scope", "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
            ));
            
        } catch (Exception e) {
            logger.error("Failed to exchange Gmail code in token-exchange endpoint", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Exchange OAuth code for tokens (called from frontend)
     */
    @PostMapping("/gmail/exchange")
    public ResponseEntity<?> exchangeGmailCode(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            String state = request.get("state");
            
            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
            }
            
            logger.info("Exchanging Gmail OAuth code from frontend");
            
            // For development - use default user ID (in production, get from JWT token)
            Long userId = 1L;
            logger.warn("Using default user ID for development: {}", userId);
            
            // Exchange code for tokens and save account
            var tokenResponse = gmailOAuthService.exchangeCodeForTokens(code);
            String emailAddress = gmailOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            // Save the email account to database
            EmailAccountResponse savedAccount = emailAuthService.saveGmailAccount(
                userId, emailAddress, tokenResponse.getAccessToken(), 
                tokenResponse.getRefreshToken(), tokenResponse.getExpiresIn());
            
            logger.info("Successfully saved Gmail account for user {}: {}", userId, emailAddress);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "email", emailAddress,
                "accountId", savedAccount.getId(),
                "message", "Gmail account connected successfully and ready for transaction extraction",
                "access_token", tokenResponse.getAccessToken(),
                "refresh_token", tokenResponse.getRefreshToken() != null ? tokenResponse.getRefreshToken() : "",
                "expires_in", tokenResponse.getExpiresIn()
            ));
            
        } catch (Exception e) {
            logger.error("Failed to exchange Gmail code", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Initiate OAuth flow for Gmail
     */
    @PostMapping("/gmail/authorize")
    public ResponseEntity<?> initiateGmailAuth(HttpServletRequest request, @RequestBody(required = false) Map<String, String> body) {
        logger.info("=== GMAIL AUTHORIZE ENDPOINT CALLED === body: {} (body is null: {})", body, body == null);
        try {
            
            // Check if this is a token exchange request
            if (body != null && body.containsKey("code") && body.get("code") != null && !body.get("code").trim().isEmpty()) {
                logger.info("Token exchange request detected in authorize endpoint with code: {}", 
                           body.get("code").substring(0, Math.min(10, body.get("code").length())) + "...");
                return exchangeGmailCode(body);
            }
            
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                // Temporary fix for development - use default user ID
                userId = 1L;
                logger.warn("Using default user ID for development: {}", userId);
            }
            
            logger.info("Initiating Gmail OAuth for user: {}", userId);
            String authUrl = emailAuthService.initiateGmailAuth(userId);
            
            return ResponseEntity.ok(Map.of(
                "authUrl", authUrl,
                "provider", "GMAIL"
            ));
            
        } catch (Exception e) {
            logger.error("Failed to initiate Gmail auth", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to initiate Gmail authentication"));
        }
    }

    
    /**
     * Initiate OAuth flow for Outlook
     */
    @PostMapping("/outlook/authorize")
    public ResponseEntity<?> initiateOutlookAuth(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            logger.info("Initiating Outlook OAuth for user: {}", userId);
            String authUrl = emailAuthService.initiateOutlookAuth(userId);
            
            return ResponseEntity.ok(Map.of(
                "authUrl", authUrl,
                "provider", "OUTLOOK"
            ));
            
        } catch (Exception e) {
            logger.error("Failed to initiate Outlook auth", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to initiate Outlook authentication"));
        }
    }
    
    /**
     * Handle OAuth callback for Gmail
     */
    @GetMapping("/callback/gmail")
    public void handleGmailCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            HttpServletResponse response) {
        try {
            logger.info("Handling Gmail OAuth callback with code: {}, state: {}", 
                       code.substring(0, Math.min(10, code.length())) + "...", state);
            
            // Get tokens directly without storing in database
            var tokenResponse = emailAuthService.getGmailTokensForDebug(code, state);
            
            // Get user email
            String email = tokenResponse.getEmail();
            String accessToken = tokenResponse.getAccessToken();
            String refreshToken = tokenResponse.getRefreshToken();
            int expiresIn = tokenResponse.getExpiresIn();
            
            // Redirect to frontend with tokens for display
            String redirectUrl = String.format(
                "http://localhost:3000/profile?auth=success&provider=gmail&email=%s&access_token=%s&refresh_token=%s&expires_in=%d", 
                java.net.URLEncoder.encode(email, "UTF-8"),
                java.net.URLEncoder.encode(accessToken.substring(0, Math.min(20, accessToken.length())) + "...", "UTF-8"),
                refreshToken != null ? java.net.URLEncoder.encode(refreshToken.substring(0, Math.min(20, refreshToken.length())) + "...", "UTF-8") : "null",
                expiresIn
            );
            
            logger.info("Redirecting to frontend with tokens for user: {}", email);
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            logger.error("Failed to handle Gmail callback", e);
            try {
                String redirectUrl = "http://localhost:3000/profile?auth=error&provider=gmail&error=" + 
                                   java.net.URLEncoder.encode(e.getMessage(), "UTF-8");
                response.sendRedirect(redirectUrl);
            } catch (Exception ex) {
                logger.error("Failed to redirect with error", ex);
            }
        }
    }
    
    /**
     * Handle OAuth callback for Outlook
     */
    @GetMapping("/callback/outlook")
    public void handleOutlookCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            HttpServletResponse response) {
        try {
            logger.info("Handling Outlook OAuth callback with state: {}", state);
            EmailAccountResponse emailAccount = emailAuthService.handleOutlookCallback(code, state);
            
            // Redirect to frontend with success
            String redirectUrl = String.format("http://localhost:3000/profile?auth=success&provider=outlook&email=%s", 
                                              emailAccount.getEmailAddress());
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            logger.error("Failed to handle Outlook callback", e);
            try {
                String redirectUrl = "http://localhost:3000/profile?auth=error&provider=outlook&error=" + 
                                   java.net.URLEncoder.encode(e.getMessage(), "UTF-8");
                response.sendRedirect(redirectUrl);
            } catch (Exception ex) {
                logger.error("Failed to redirect with error", ex);
            }
        }
    }
    
    /**
     * Get connected email accounts for the authenticated user
     */
    private static volatile Map<String, Object> accountsCache;
    private static volatile long accountsCacheTime;
    private static final long ACCOUNTS_CACHE_DURATION = 5000; // 5 seconds cache
    
    @GetMapping("/accounts")
    public ResponseEntity<?> getConnectedAccounts(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                // Temporary fix for development - use default user ID
                userId = 1L;
                logger.warn("Using default user ID for development: {}", userId);
            }
            
            // Simple cache to prevent spam requests
            long currentTime = System.currentTimeMillis();
            if (accountsCache != null && (currentTime - accountsCacheTime) < ACCOUNTS_CACHE_DURATION) {
                return ResponseEntity.ok(accountsCache);
            }
            
            List<EmailAccountResponse> accounts = emailAuthService.getConnectedAccounts(userId);
            Map<String, Object> response = Map.of(
                "accounts", accounts,
                "totalAccounts", accounts.size()
            );
            
            // Update cache
            accountsCache = response;
            accountsCacheTime = currentTime;
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get connected accounts", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve connected accounts"));
        }
    }
    
    /**
     * Disconnect an email account
     */
    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<?> disconnectAccount(
            @PathVariable Long accountId,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            boolean disconnected = emailAuthService.disconnectAccount(userId, accountId);
            
            if (disconnected) {
                return ResponseEntity.ok(Map.of("message", "Account disconnected successfully"));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Account not found or access denied"));
            }
            
        } catch (Exception e) {
            logger.error("Failed to disconnect account", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to disconnect account"));
        }
    }
    
    /**
     * Trigger manual sync for an email account
     */
    @PostMapping("/accounts/{accountId}/sync")
    public ResponseEntity<?> triggerSync(
            @PathVariable Long accountId,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID not found"));
            }
            
            boolean syncTriggered = emailAuthService.triggerManualSync(userId, accountId);
            
            if (syncTriggered) {
                return ResponseEntity.ok(Map.of("message", "Sync triggered successfully"));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Account not found or sync already in progress"));
            }
            
        } catch (Exception e) {
            logger.error("Failed to trigger sync", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to trigger sync"));
        }
    }
}