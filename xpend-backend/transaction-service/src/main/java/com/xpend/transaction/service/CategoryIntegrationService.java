package com.xpend.transaction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.*;

/**
 * Service for integrating with category-service to validate categories
 */
@Service
public class CategoryIntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(CategoryIntegrationService.class);
    
    @Value("${category-service.base-url:http://localhost:8083}")
    private String categoryServiceBaseUrl;
    
    @Value("${category-service.timeout:5000}")
    private int timeout;
    
    private final RestTemplate restTemplate;
    
    public CategoryIntegrationService() {
        this.restTemplate = new RestTemplate();
        // TODO: Configure timeout and other settings
    }
    
    /**
     * Check if user has access to a specific category
     */
    public boolean userHasAccessToCategory(UUID categoryId, Long userId) {
        if (categoryId == null || userId == null) {
            return false;
        }
        
        try {
            String url = categoryServiceBaseUrl + "/api/categories/" + categoryId + "/access?userId=" + userId;
            logger.debug("Checking category access for user {} and category {}", userId, categoryId);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return Boolean.TRUE.equals(body.get("hasAccess"));
            }
            
            return false;
            
        } catch (RestClientException e) {
            logger.warn("Failed to validate category access for user {} and category {} - assuming access granted: {}", 
                       userId, categoryId, e.getMessage());
            // In case of service unavailability, assume access granted to prevent blocking legitimate requests
            // TODO: Implement circuit breaker pattern
            return true;
        } catch (Exception e) {
            logger.error("Unexpected error validating category access for user {} and category {}: {}", 
                        userId, categoryId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get category information
     */
    public Map<String, Object> getCategoryInfo(UUID categoryId, Long userId) {
        if (categoryId == null || userId == null) {
            return null;
        }
        
        try {
            String url = categoryServiceBaseUrl + "/api/categories/" + categoryId + "?userId=" + userId;
            logger.debug("Fetching category info for category {} and user {}", categoryId, userId);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
            
            return null;
            
        } catch (RestClientException e) {
            logger.warn("Failed to fetch category info for {} and user {}: {}", categoryId, userId, e.getMessage());
            return null;
        } catch (Exception e) {
            logger.error("Unexpected error fetching category info for {} and user {}: {}", 
                        categoryId, userId, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Get category name
     */
    public String getCategoryName(UUID categoryId, Long userId) {
        Map<String, Object> categoryInfo = getCategoryInfo(categoryId, userId);
        if (categoryInfo != null) {
            Object name = categoryInfo.get("name");
            if (name != null) {
                return name.toString();
            }
        }
        
        return "Category " + categoryId;
    }
    
    /**
     * Validate multiple categories for a user
     */
    public Map<UUID, Boolean> validateCategoriesForUser(Set<UUID> categoryIds, Long userId) {
        Map<UUID, Boolean> results = new HashMap<>();
        
        if (categoryIds == null || categoryIds.isEmpty() || userId == null) {
            return results;
        }
        
        try {
            String url = categoryServiceBaseUrl + "/api/categories/validate-batch";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("categoryIds", categoryIds);
            requestBody.put("userId", userId);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object validCategoriesObj = body.get("validCategories");
                
                if (validCategoriesObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Boolean> validCategories = (Map<String, Boolean>) validCategoriesObj;
                    
                    for (UUID categoryId : categoryIds) {
                        String categoryIdStr = categoryId.toString();
                        results.put(categoryId, validCategories.getOrDefault(categoryIdStr, false));
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warn("Failed to validate categories in batch for user {}: {}", userId, e.getMessage());
            // Fall back to individual validation
            for (UUID categoryId : categoryIds) {
                results.put(categoryId, userHasAccessToCategory(categoryId, userId));
            }
        }
        
        return results;
    }
    
    /**
     * Get all categories accessible to user
     */
    public List<Map<String, Object>> getUserCategories(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        try {
            String url = categoryServiceBaseUrl + "/api/categories?userId=" + userId;
            logger.debug("Fetching categories for user {}", userId);
            
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> categories = response.getBody();
                return categories;
            }
            
            return new ArrayList<>();
            
        } catch (Exception e) {
            logger.warn("Failed to fetch categories for user {}: {}", userId, e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get category names for multiple category IDs
     */
    public Map<UUID, String> getCategoryNames(Set<UUID> categoryIds, Long userId) {
        Map<UUID, String> categoryNames = new HashMap<>();
        
        if (categoryIds == null || categoryIds.isEmpty() || userId == null) {
            return categoryNames;
        }
        
        try {
            String url = categoryServiceBaseUrl + "/api/categories/names";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("categoryIds", categoryIds);
            requestBody.put("userId", userId);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object categoryNamesObj = body.get("categoryNames");
                
                if (categoryNamesObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, String> names = (Map<String, String>) categoryNamesObj;
                    
                    for (UUID categoryId : categoryIds) {
                        String categoryIdStr = categoryId.toString();
                        categoryNames.put(categoryId, names.getOrDefault(categoryIdStr, "Category " + categoryId));
                    }
                }
            }
            
        } catch (Exception e) {
            logger.warn("Failed to fetch category names for user {}: {}", userId, e.getMessage());
            // Fall back to individual category name fetching
            for (UUID categoryId : categoryIds) {
                categoryNames.put(categoryId, getCategoryName(categoryId, userId));
            }
        }
        
        return categoryNames;
    }
    
    /**
     * Check service health
     */
    public boolean isServiceHealthy() {
        try {
            String url = categoryServiceBaseUrl + "/api/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
            
        } catch (Exception e) {
            logger.debug("Category service health check failed: {}", e.getMessage());
            return false;
        }
    }
}