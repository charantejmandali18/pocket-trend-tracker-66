package com.xpend.customer.service;

import com.xpend.customer.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class SecurityAuditService {
    
    private static final Logger securityLogger = LoggerFactory.getLogger("SECURITY_AUDIT");
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    public void logRegistration(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "REGISTRATION | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logSuccessfulLogin(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "LOGIN | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logFailedLogin(User user, String reason, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "LOGIN | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: FAILED | Reason: %s | FailedAttempts: %d",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT),
            reason,
            user.getFailedLoginAttempts()
        );
        securityLogger.warn(logMessage);
    }
    
    public void logAccountLocked(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "ACCOUNT_LOCKED | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | FailedAttempts: %d",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT),
            user.getFailedLoginAttempts()
        );
        securityLogger.error(logMessage);
    }
    
    public void logLogout(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "LOGOUT | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logLogoutAll(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "LOGOUT_ALL | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logTokenRefresh(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "TOKEN_REFRESH | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.debug(logMessage);
    }
    
    public void logSuspiciousActivity(User user, String activity, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "SUSPICIOUS_ACTIVITY | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Activity: %s",
            user != null ? user.getId() : "UNKNOWN",
            user != null ? user.getEmail() : "UNKNOWN",
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT),
            activity
        );
        securityLogger.warn(logMessage);
    }
    
    public void logPasswordChange(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "PASSWORD_CHANGE | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logEmailVerification(User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "EMAIL_VERIFICATION | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logOAuthLogin(String provider, User user, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "OAUTH_LOGIN | Provider: %s | User: %s | Email: %s | IP: %s | UserAgent: %s | Timestamp: %s | Status: SUCCESS",
            provider,
            user.getId(),
            user.getEmail(),
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.info(logMessage);
    }
    
    public void logRateLimitExceeded(String identifier, String ipAddress, String userAgent) {
        String logMessage = String.format(
            "RATE_LIMIT_EXCEEDED | Identifier: %s | IP: %s | UserAgent: %s | Timestamp: %s",
            identifier,
            ipAddress,
            truncateUserAgent(userAgent),
            LocalDateTime.now().format(TIMESTAMP_FORMAT)
        );
        securityLogger.warn(logMessage);
    }
    
    private String truncateUserAgent(String userAgent) {
        if (userAgent == null) {
            return "UNKNOWN";
        }
        return userAgent.length() > 200 ? userAgent.substring(0, 200) + "..." : userAgent;
    }
}