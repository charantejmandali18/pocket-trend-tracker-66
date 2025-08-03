package com.xpend.customer.controller;

import com.xpend.customer.config.RateLimitConfig;
import com.xpend.customer.dto.AuthResponse;
import com.xpend.customer.dto.LoginRequest;
import com.xpend.customer.dto.RegisterRequest;
import com.xpend.customer.exception.AuthenticationException;
import com.xpend.customer.service.AuthService;
import com.xpend.customer.service.SecurityAuditService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private SecurityAuditService securityAuditService;
    
    @Autowired
    private RateLimitConfig rateLimitConfig;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        logger.info("Registration attempt from IP: {}", ipAddress);
        
        // Rate limiting for registration
        Bucket bucket = rateLimitConfig.resolveBucket(ipAddress, "registration");
        ConsumptionProbe result = bucket.tryConsumeAndReturnRemaining(1);
        
        if (!result.isConsumed()) {
            securityAuditService.logRateLimitExceeded("registration:" + ipAddress, ipAddress, userAgent);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded");
            errorResponse.put("message", "Too many registration attempts. Please try again later.");
            errorResponse.put("retryAfterSeconds", result.getNanosToWaitForRefill() / 1_000_000_000);
            
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }
        
        // Validate password confirmation
        if (!request.isPasswordMatching()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Password mismatch");
            errorResponse.put("message", "Password and confirmation password do not match");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        try {
            AuthResponse authResponse = authService.register(request, ipAddress, userAgent);
            logger.info("User registered successfully: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
            
        } catch (Exception e) {
            logger.error("Registration failed for email: {}", request.getEmail(), e);
            throw e;
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        logger.info("Login attempt for email: {} from IP: {}", request.getEmail(), ipAddress);
        
        // Rate limiting for login
        Bucket bucket = rateLimitConfig.resolveBucket(ipAddress, "login");
        ConsumptionProbe result = bucket.tryConsumeAndReturnRemaining(1);
        
        if (!result.isConsumed()) {
            securityAuditService.logRateLimitExceeded("login:" + ipAddress, ipAddress, userAgent);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded");
            errorResponse.put("message", "Too many login attempts. Please try again later.");
            errorResponse.put("retryAfterSeconds", result.getNanosToWaitForRefill() / 1_000_000_000);
            
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }
        
        try {
            AuthResponse authResponse = authService.login(request, ipAddress, userAgent);
            logger.info("User logged in successfully: {}", request.getEmail());
            return ResponseEntity.ok(authResponse);
            
        } catch (Exception e) {
            logger.warn("Login failed for email: {} from IP: {}", request.getEmail(), ipAddress);
            throw e;
        }
    }
    
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String refreshToken = request.get("refreshToken");
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new AuthenticationException("Refresh token is required");
        }
        
        // Rate limiting for token refresh
        Bucket bucket = rateLimitConfig.resolveBucket(ipAddress, "token-refresh");
        ConsumptionProbe result = bucket.tryConsumeAndReturnRemaining(1);
        
        if (!result.isConsumed()) {
            securityAuditService.logRateLimitExceeded("token-refresh:" + ipAddress, ipAddress, userAgent);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Rate limit exceeded");
            errorResponse.put("message", "Too many token refresh attempts. Please try again later.");
            errorResponse.put("retryAfterSeconds", result.getNanosToWaitForRefill() / 1_000_000_000);
            
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }
        
        try {
            AuthResponse authResponse = authService.refreshToken(refreshToken, ipAddress, userAgent);
            return ResponseEntity.ok(authResponse);
            
        } catch (Exception e) {
            logger.warn("Token refresh failed from IP: {}", ipAddress);
            throw e;
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String refreshToken = request.get("refreshToken");
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            // Silent logout if no refresh token provided
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logged out successfully");
            return ResponseEntity.ok(response);
        }
        
        try {
            authService.logout(refreshToken, ipAddress, userAgent);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logged out successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.warn("Logout failed from IP: {}", ipAddress, e);
            // Return success even on logout errors for security
            Map<String, String> response = new HashMap<>();
            response.put("message", "Logged out successfully");
            return ResponseEntity.ok(response);
        }
    }
    
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(
            @RequestBody Map<String, Long> request,
            HttpServletRequest httpRequest) {
        
        Long userId = request.get("userId");
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        if (userId == null) {
            throw new AuthenticationException("User ID is required");
        }
        
        try {
            authService.logoutAll(userId, ipAddress, userAgent);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "All sessions logged out successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Logout all failed for user: {} from IP: {}", userId, ipAddress, e);
            throw e;
        }
    }
    
    @PostMapping("/validate-token")
    public ResponseEntity<?> validateToken(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new AuthenticationException("Refresh token is required");
        }
        
        try {
            boolean isValid = authService.isValidRefreshToken(refreshToken);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.warn("Token validation failed", e);
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            return ResponseEntity.ok(response);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "auth-service");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        // Check for X-Forwarded-For header (proxy/load balancer)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // Get the first IP in the chain
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