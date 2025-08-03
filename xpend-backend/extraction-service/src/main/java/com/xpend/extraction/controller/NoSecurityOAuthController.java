package com.xpend.extraction.controller;

import com.xpend.extraction.service.GmailOAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OAuth controller that bypasses Spring Security completely
 * Only enabled in development
 */
@RestController
@RequestMapping("/oauth-dev")
@CrossOrigin(origins = "*")
@Profile("!production") // Only active when NOT production profile
public class NoSecurityOAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(NoSecurityOAuthController.class);
    
    @Autowired
    private GmailOAuthService gmailOAuthService;
    
    @PostMapping("/gmail/exchange")
    public ResponseEntity<?> exchangeGmailTokens(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            String state = request.get("state");
            
            logger.info("DEV OAuth exchange called with code: {}", 
                       code != null ? code.substring(0, Math.min(10, code.length())) + "..." : "null");
            
            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
            }
            
            // Get tokens directly
            var tokenResponse = gmailOAuthService.exchangeCodeForTokens(code);
            
            // Get user email
            String emailAddress = gmailOAuthService.getUserEmail(tokenResponse.getAccessToken());
            
            logger.info("SUCCESS: Exchanged tokens for email: {}", emailAddress);
            
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
            logger.error("FAILED: OAuth exchange error", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        return ResponseEntity.ok(Map.of("status", "OAuth dev endpoint working!", "message", "Security bypassed"));
    }
}