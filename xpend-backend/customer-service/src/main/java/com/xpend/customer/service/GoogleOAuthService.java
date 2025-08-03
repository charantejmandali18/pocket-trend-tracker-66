package com.xpend.customer.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.xpend.customer.dto.AuthResponse;
import com.xpend.customer.entity.RefreshToken;
import com.xpend.customer.entity.User;
import com.xpend.customer.repository.RefreshTokenRepository;
import com.xpend.customer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;

@Service
@Transactional
public class GoogleOAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthService.class);
    
    @Value("${google.oauth.client-id}")
    private String googleClientId;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private SecurityAuditService securityAuditService;
    
    private final SecureRandom secureRandom = new SecureRandom();
    private final GoogleIdTokenVerifier verifier;
    
    public GoogleOAuthService(@Value("${google.oauth.client-id:}") String clientId) {
        if (clientId != null && !clientId.trim().isEmpty() && !clientId.equals("dummy-client-id")) {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
        } else {
            this.verifier = null;
            logger.warn("Google OAuth client ID not configured. Google authentication will be disabled.");
        }
    }
    
    public AuthResponse authenticateWithGoogle(String idTokenString, String ipAddress, String userAgent) {
        logger.info("Google OAuth authentication attempt from IP: {}", ipAddress);
        
        if (verifier == null) {
            throw new RuntimeException("Google OAuth is not configured. Please contact the administrator.");
        }
        
        try {
            // Verify the Google ID token
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }
            
            GoogleIdToken.Payload payload = idToken.getPayload();
            
            // Extract user information from Google token
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            Boolean emailVerified = payload.getEmailVerified();
            
            if (email == null || !emailVerified) {
                throw new RuntimeException("Google account email not verified");
            }
            
            logger.info("Google OAuth: Processing user with email: {}", email);
            
            // Find or create user
            User user = findOrCreateGoogleUser(email, name, pictureUrl);
            
            // Generate tokens
            String accessToken = jwtService.generateAccessToken(user);
            String refreshTokenValue = generateSecureRefreshToken();
            
            // Save refresh token
            RefreshToken refreshToken = createRefreshToken(refreshTokenValue, user, ipAddress, userAgent);
            refreshTokenRepository.save(refreshToken);
            
            // Clean up old tokens
            cleanupOldRefreshTokens(user);
            
            // Log security event
            securityAuditService.logOAuthLogin("Google", user, ipAddress, userAgent);
            
            logger.info("Google OAuth authentication successful for user: {}", email);
            
            return new AuthResponse(
                accessToken,
                refreshTokenValue,
                jwtService.getAccessTokenExpiration(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getProfilePictureUrl(),
                user.getRoles()
            );
            
        } catch (Exception e) {
            logger.error("Google OAuth authentication failed from IP: {}", ipAddress, e);
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
    }
    
    private User findOrCreateGoogleUser(String email, String name, String pictureUrl) {
        Optional<User> existingUser = userRepository.findByEmail(email.toLowerCase().trim());
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            
            // Update user information from Google if needed
            boolean updated = false;
            
            if (user.getAuthProvider() != User.AuthProvider.GOOGLE && 
                user.getAuthProvider() != User.AuthProvider.LOCAL) {
                user.setAuthProvider(User.AuthProvider.GOOGLE);
                updated = true;
            }
            
            if (name != null && !name.equals(user.getFullName())) {
                user.setFullName(name);
                updated = true;
            }
            
            if (pictureUrl != null && !pictureUrl.equals(user.getProfilePictureUrl())) {
                user.setProfilePictureUrl(pictureUrl);
                updated = true;
            }
            
            if (!user.getEmailVerified()) {
                user.setEmailVerified(true);
                updated = true;
            }
            
            user.setLastLoginAt(LocalDateTime.now());
            user.resetFailedLoginAttempts(); // Reset any failed login attempts
            
            if (updated) {
                user = userRepository.save(user);
                logger.info("Updated existing user from Google: {}", email);
            }
            
            return user;
        } else {
            // Create new user from Google account
            User newUser = new User();
            newUser.setEmail(email.toLowerCase().trim());
            newUser.setFullName(name != null ? name : "");
            newUser.setProfilePictureUrl(pictureUrl);
            newUser.setAuthProvider(User.AuthProvider.GOOGLE);
            newUser.setEmailVerified(true);
            newUser.setGoogleId(email); // Use email as Google ID for now
            newUser.setLastLoginAt(LocalDateTime.now());
            
            newUser = userRepository.save(newUser);
            logger.info("Created new user from Google: {}", email);
            
            return newUser;
        }
    }
    
    private String generateSecureRefreshToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
    
    private RefreshToken createRefreshToken(String tokenValue, User user, String ipAddress, String userAgent) {
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000);
        return new RefreshToken(tokenValue, user, expiresAt, userAgent, ipAddress);
    }
    
    private void cleanupOldRefreshTokens(User user) {
        // Same cleanup logic as AuthService
        long activeTokenCount = refreshTokenRepository.countValidTokensForUser(user, LocalDateTime.now());
        
        if (activeTokenCount >= 5) { // MAX_REFRESH_TOKENS_PER_USER
            var userTokens = refreshTokenRepository.findByUserAndRevokedFalse(user);
            userTokens.stream()
                .sorted((t1, t2) -> t1.getCreatedAt().compareTo(t2.getCreatedAt()))
                .limit(userTokens.size() - 4) // Keep 4, revoke the rest
                .forEach(RefreshToken::revoke);
            
            refreshTokenRepository.saveAll(userTokens);
        }
        
        // Clean up expired and revoked tokens
        refreshTokenRepository.deleteExpiredAndRevokedTokens(LocalDateTime.now());
    }
}