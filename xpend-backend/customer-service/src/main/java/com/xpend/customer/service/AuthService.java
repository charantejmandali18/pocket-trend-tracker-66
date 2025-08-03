package com.xpend.customer.service;

import com.xpend.customer.dto.AuthResponse;
import com.xpend.customer.dto.LoginRequest;
import com.xpend.customer.dto.RegisterRequest;
import com.xpend.customer.entity.RefreshToken;
import com.xpend.customer.entity.User;
import com.xpend.customer.exception.AuthenticationException;
import com.xpend.customer.exception.UserAlreadyExistsException;
import com.xpend.customer.exception.UserNotFoundException;
import com.xpend.customer.repository.RefreshTokenRepository;
import com.xpend.customer.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@Transactional
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_REFRESH_TOKENS_PER_USER = 5;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private SecurityAuditService securityAuditService;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        logger.info("Registration attempt for email: {}", request.getEmail());
        
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }
        
        // Create new user with secure password
        User user = new User();
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setFullName(request.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setEmailVerified(true); // For demo purposes, set to true. In production, implement email verification
        
        user = userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = generateSecureRefreshToken();
        
        // Save refresh token
        RefreshToken refreshToken = createRefreshToken(refreshTokenValue, user, ipAddress, userAgent);
        refreshTokenRepository.save(refreshToken);
        
        // Clean up old tokens
        cleanupOldRefreshTokens(user);
        
        // Log security event
        securityAuditService.logRegistration(user, ipAddress, userAgent);
        
        logger.info("User registered successfully: {}", user.getEmail());
        
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
    }
    
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        logger.info("Login attempt for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new UserNotFoundException("Invalid email or password"));
        
        // Check if account is locked
        if (user.getAccountLocked()) {
            securityAuditService.logFailedLogin(user, "Account locked", ipAddress, userAgent);
            throw new AuthenticationException("Account is locked due to multiple failed login attempts");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user, ipAddress, userAgent);
            throw new AuthenticationException("Invalid email or password");
        }
        
        // Reset failed login attempts on successful login
        user.resetFailedLoginAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = generateSecureRefreshToken();
        
        // Save refresh token
        RefreshToken refreshToken = createRefreshToken(refreshTokenValue, user, ipAddress, userAgent);
        refreshTokenRepository.save(refreshToken);
        
        // Clean up old tokens
        cleanupOldRefreshTokens(user);
        
        // Log successful login
        securityAuditService.logSuccessfulLogin(user, ipAddress, userAgent);
        
        logger.info("User logged in successfully: {}", user.getEmail());
        
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
    }
    
    public AuthResponse refreshToken(String refreshTokenValue, String ipAddress, String userAgent) {
        logger.debug("Token refresh attempt");
        
        RefreshToken refreshToken = refreshTokenRepository.findValidToken(refreshTokenValue, LocalDateTime.now())
            .orElseThrow(() -> new AuthenticationException("Invalid or expired refresh token"));
        
        User user = refreshToken.getUser();
        
        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user);
        
        // Optionally rotate refresh token for enhanced security
        String newRefreshTokenValue = generateSecureRefreshToken();
        
        // Revoke old refresh token
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);
        
        // Create new refresh token
        RefreshToken newRefreshToken = createRefreshToken(newRefreshTokenValue, user, ipAddress, userAgent);
        refreshTokenRepository.save(newRefreshToken);
        
        logger.debug("Token refreshed successfully for user: {}", user.getEmail());
        
        return new AuthResponse(
            newAccessToken,
            newRefreshTokenValue,
            jwtService.getAccessTokenExpiration(),
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getProfilePictureUrl(),
            user.getRoles()
        );
    }
    
    public void logout(String refreshTokenValue, String ipAddress, String userAgent) {
        logger.info("Logout attempt");
        
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(refreshTokenValue);
        if (refreshToken.isPresent()) {
            RefreshToken token = refreshToken.get();
            token.revoke();
            refreshTokenRepository.save(token);
            
            securityAuditService.logLogout(token.getUser(), ipAddress, userAgent);
            logger.info("User logged out successfully: {}", token.getUser().getEmail());
        }
    }
    
    public void logoutAll(Long userId, String ipAddress, String userAgent) {
        logger.info("Logout all sessions for user ID: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        refreshTokenRepository.revokeAllUserTokens(user);
        securityAuditService.logLogoutAll(user, ipAddress, userAgent);
        
        logger.info("All sessions logged out for user: {}", user.getEmail());
    }
    
    private void handleFailedLogin(User user, String ipAddress, String userAgent) {
        user.incrementFailedLoginAttempts();
        userRepository.save(user);
        
        securityAuditService.logFailedLogin(user, "Invalid password", ipAddress, userAgent);
        
        logger.warn("Failed login attempt for user: {} (attempt {})", 
                   user.getEmail(), user.getFailedLoginAttempts());
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
        long activeTokenCount = refreshTokenRepository.countValidTokensForUser(user, LocalDateTime.now());
        
        if (activeTokenCount >= MAX_REFRESH_TOKENS_PER_USER) {
            // Get all user's tokens and revoke the oldest ones
            var userTokens = refreshTokenRepository.findByUserAndRevokedFalse(user);
            userTokens.stream()
                .sorted((t1, t2) -> t1.getCreatedAt().compareTo(t2.getCreatedAt()))
                .limit(userTokens.size() - MAX_REFRESH_TOKENS_PER_USER + 1)
                .forEach(RefreshToken::revoke);
            
            refreshTokenRepository.saveAll(userTokens);
        }
        
        // Clean up expired and revoked tokens
        refreshTokenRepository.deleteExpiredAndRevokedTokens(LocalDateTime.now());
    }
    
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
    
    public boolean isValidRefreshToken(String tokenValue) {
        return refreshTokenRepository.findValidToken(tokenValue, LocalDateTime.now()).isPresent();
    }
}