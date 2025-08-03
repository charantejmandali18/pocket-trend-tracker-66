package com.xpend.transaction.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.access-token.expiration}")
    private long accessTokenExpiration;
    
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    /**
     * Extract username (user ID) from JWT token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extract user ID as Long from JWT token
     */
    public Long extractUserId(String token) {
        try {
            String subject = extractUsername(token);
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            logger.error("Invalid user ID in JWT token: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract expiration date from JWT token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract specific claim from JWT token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extract all claims from JWT token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            logger.error("Error parsing JWT token: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT token", e);
        }
    }
    
    /**
     * Check if JWT token is expired
     */
    public Boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            logger.error("Error checking if token is expired: {}", e.getMessage());
            return true;
        }
    }
    
    /**
     * Validate JWT token
     */
    public Boolean validateToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return false;
            }
            
            // Extract claims to verify token structure and signature
            Claims claims = extractAllClaims(token);
            
            // Check if token is expired
            if (isTokenExpired(token)) {
                logger.debug("JWT token is expired");
                return false;
            }
            
            // Check if user ID is valid
            Long userId = extractUserId(token);
            if (userId == null || userId <= 0) {
                logger.debug("Invalid user ID in JWT token");
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Extract all user information from JWT token
     */
    public java.util.Map<String, Object> extractUserInfo(String token) {
        try {
            Claims claims = extractAllClaims(token);
            java.util.Map<String, Object> userInfo = new java.util.HashMap<>();
            
            userInfo.put("userId", extractUserId(token));
            userInfo.put("username", claims.getSubject());
            userInfo.put("email", claims.get("email", String.class));
            userInfo.put("fullName", claims.get("fullName", String.class));
            userInfo.put("roles", claims.get("roles", java.util.List.class));
            userInfo.put("issuedAt", claims.getIssuedAt());
            userInfo.put("expiresAt", claims.getExpiration());
            
            return userInfo;
            
        } catch (Exception e) {
            logger.error("Error extracting user info from JWT token: {}", e.getMessage());
            return new java.util.HashMap<>();
        }
    }
    
    /**
     * Check if user has specific role
     */
    public boolean hasRole(String token, String role) {
        try {
            Claims claims = extractAllClaims(token);
            @SuppressWarnings("unchecked")
            java.util.List<String> roles = claims.get("roles", java.util.List.class);
            
            return roles != null && roles.contains(role);
            
        } catch (Exception e) {
            logger.error("Error checking user role: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get token remaining validity time in milliseconds
     */  
    public long getRemainingValidityTime(String token) {
        try {
            Date expiration = extractExpiration(token);
            return expiration.getTime() - System.currentTimeMillis();
        } catch (Exception e) {
            logger.error("Error getting remaining validity time: {}", e.getMessage());
            return 0;
        }
    }
}