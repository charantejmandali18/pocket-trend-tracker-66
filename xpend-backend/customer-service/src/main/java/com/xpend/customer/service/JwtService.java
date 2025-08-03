package com.xpend.customer.service;

import com.xpend.customer.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    
    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;
    
    @Value("${jwt.access-token.expiration:900000}") // 15 minutes
    private long accessTokenExpiration;
    
    @Value("${jwt.refresh-token.expiration:2592000000}") // 30 days
    private long refreshTokenExpiration;
    
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    public String generateAccessToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("fullName", user.getFullName());
        extraClaims.put("roles", user.getRoles());
        extraClaims.put("authProvider", user.getAuthProvider());
        extraClaims.put("emailVerified", user.getEmailVerified());
        
        return generateToken(extraClaims, user.getEmail(), accessTokenExpiration);
    }
    
    public String generateRefreshToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("tokenType", "refresh");
        
        return generateToken(extraClaims, user.getEmail(), refreshTokenExpiration);
    }
    
    private String generateToken(Map<String, Object> extraClaims, String subject, long expiration) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expirationDate)
                .issuer("xpend-auth-service")
                .audience().add("xpend-app").and()
                .signWith(getSignInKey())
                .compact();
    }
    
    public boolean isTokenValid(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username)) && !isTokenExpired(token);
        } catch (Exception e) {
            logger.warn("Token validation failed for user {}: {}", username, e.getMessage());
            return false;
        }
    }
    
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            logger.warn("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }
    
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    public LocalDateTime extractExpirationAsLocalDateTime(String token) {
        Date expiration = extractExpiration(token);
        return expiration.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
    
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }
    
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("tokenType", String.class));
    }
    
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token is expired: {}", e.getMessage());
            throw e;
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            logger.error("JWT token is malformed: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            logger.error("JWT signature does not match: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            logger.error("JWT token compact is empty: {}", e.getMessage());
            throw e;
        }
    }
    
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }
    
    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
    
    // Security utility methods
    public boolean validateTokenStructure(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        
        String[] parts = token.split("\\.");
        return parts.length == 3; // Header.Payload.Signature
    }
    
    public String extractTokenFromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }
}