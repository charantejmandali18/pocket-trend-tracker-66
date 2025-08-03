package com.xpend.transaction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for integrating with customer-service to validate users
 */
@Service
public class CustomerIntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerIntegrationService.class);
    
    @Value("${customer-service.base-url}")
    private String customerServiceBaseUrl;
    
    @Value("${customer-service.timeout:5000}")
    private int timeout;
    
    private final RestTemplate restTemplate;
    
    public CustomerIntegrationService() {
        this.restTemplate = new RestTemplate();
        // TODO: Configure timeout and other settings
    }
    
    /**
     * Check if user exists in customer service
     */
    public boolean userExists(Long userId) {
        if (userId == null) {
            return false;
        }
        
        try {
            String url = customerServiceBaseUrl + "/api/users/" + userId + "/exists";
            logger.debug("Checking if user exists: {}", userId);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return Boolean.TRUE.equals(body.get("exists"));
            }
            
            return false;
            
        } catch (RestClientException e) {
            logger.warn("Failed to validate user {} - assuming user exists to prevent blocking: {}", userId, e.getMessage());
            // In case of service unavailability, assume user exists to prevent blocking legitimate requests
            // TODO: Implement circuit breaker pattern
            return true;
        } catch (Exception e) {
            logger.error("Unexpected error validating user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get user information
     */
    public Map<String, Object> getUserInfo(Long userId) {
        if (userId == null) {
            return null;
        }
        
        try {
            String url = customerServiceBaseUrl + "/api/users/" + userId;
            logger.debug("Fetching user info: {}", userId);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
            
            return null;
            
        } catch (RestClientException e) {
            logger.warn("Failed to fetch user info for {}: {}", userId, e.getMessage());
            return null;
        } catch (Exception e) {
            logger.error("Unexpected error fetching user info for {}: {}", userId, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Get user's display name
     */
    public String getUserDisplayName(Long userId) {
        Map<String, Object> userInfo = getUserInfo(userId);
        if (userInfo != null) {
            Object fullName = userInfo.get("fullName");
            Object email = userInfo.get("email");
            
            if (fullName != null && !fullName.toString().trim().isEmpty()) {
                return fullName.toString();
            } else if (email != null) {
                return email.toString();
            }
        }
        
        return "User " + userId;
    }
    
    /**
     * Validate multiple users at once
     */
    public Map<Long, Boolean> validateUsers(java.util.Set<Long> userIds) {
        Map<Long, Boolean> results = new HashMap<>();
        
        if (userIds == null || userIds.isEmpty()) {
            return results;
        }
        
        try {
            String url = customerServiceBaseUrl + "/api/users/validate-batch";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("userIds", userIds);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object validUsersObj = body.get("validUsers");
                
                if (validUsersObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Boolean> validUsers = (Map<String, Boolean>) validUsersObj;
                    
                    for (Long userId : userIds) {
                        String userIdStr = userId.toString();
                        results.put(userId, validUsers.getOrDefault(userIdStr, false));
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warn("Failed to validate users in batch: {}", e.getMessage());
            // Fall back to individual validation
            for (Long userId : userIds) {
                results.put(userId, userExists(userId));
            }
        }
        
        return results;
    }
    
    /**
     * Check service health
     */
    public boolean isServiceHealthy() {
        try {
            String url = customerServiceBaseUrl + "/api/auth/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
            
        } catch (Exception e) {
            logger.debug("Customer service health check failed: {}", e.getMessage());
            return false;
        }
    }
}