package com.xpend.customer.controller;

import com.xpend.customer.dto.AuthResponse;
import com.xpend.customer.service.GoogleOAuthService;
import com.xpend.customer.service.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class OAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(OAuthController.class);
    
    @Autowired
    private GoogleOAuthService googleOAuthService;
    
    @Autowired
    private SecurityAuditService securityAuditService;
    
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        logger.info("Google OAuth login attempt from IP: {}", ipAddress);
        
        try {
            AuthResponse authResponse = googleOAuthService.authenticateWithGoogle(
                request.getIdToken(), 
                ipAddress, 
                userAgent
            );
            
            logger.info("Google OAuth login successful from IP: {}", ipAddress);
            return ResponseEntity.ok(authResponse);
            
        } catch (Exception e) {
            logger.error("Google OAuth login failed from IP: {}", ipAddress, e);
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Google authentication failed");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/google/client-id")
    public ResponseEntity<?> getGoogleClientId() {
        // This endpoint provides the Google Client ID for frontend configuration
        // In production, you might want to secure this or provide it through environment configuration
        
        Map<String, String> response = new HashMap<>();
        response.put("clientId", "YOUR_GOOGLE_CLIENT_ID"); // This should come from configuration
        
        return ResponseEntity.ok(response);
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
    
    public static class GoogleLoginRequest {
        private String idToken;
        
        public GoogleLoginRequest() {}
        
        public GoogleLoginRequest(String idToken) {
            this.idToken = idToken;
        }
        
        public String getIdToken() {
            return idToken;
        }
        
        public void setIdToken(String idToken) {
            this.idToken = idToken;
        }
    }
}