package com.xpend.extraction.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.xpend.extraction.entity.EmailProvider;

import java.time.LocalDateTime;

public class EmailAccountResponse {
    
    private Long id;
    private EmailProvider provider;
    private String emailAddress;
    private Boolean isActive;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastSyncAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime tokenExpiresAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime syncFromDate;
    
    private Long totalEmailsProcessed;
    private Long totalTransactionsExtracted;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    private boolean tokenExpired;
    private boolean needsRefresh;
    
    // Constructors
    public EmailAccountResponse() {}
    
    public EmailAccountResponse(Long id, EmailProvider provider, String emailAddress, 
                               Boolean isActive, LocalDateTime lastSyncAt, 
                               LocalDateTime tokenExpiresAt, LocalDateTime syncFromDate,
                               Long totalEmailsProcessed, Long totalTransactionsExtracted,
                               LocalDateTime createdAt) {
        this.id = id;
        this.provider = provider;
        this.emailAddress = emailAddress;
        this.isActive = isActive;
        this.lastSyncAt = lastSyncAt;
        this.tokenExpiresAt = tokenExpiresAt;
        this.syncFromDate = syncFromDate;
        this.totalEmailsProcessed = totalEmailsProcessed;
        this.totalTransactionsExtracted = totalTransactionsExtracted;
        this.createdAt = createdAt;
        
        // Calculate derived fields
        this.tokenExpired = tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now());
        this.needsRefresh = tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now().plusMinutes(5));
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public EmailProvider getProvider() { return provider; }
    public void setProvider(EmailProvider provider) { this.provider = provider; }
    
    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    
    public LocalDateTime getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) { 
        this.tokenExpiresAt = tokenExpiresAt;
        this.tokenExpired = tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now());
        this.needsRefresh = tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now().plusMinutes(5));
    }
    
    public LocalDateTime getSyncFromDate() { return syncFromDate; }
    public void setSyncFromDate(LocalDateTime syncFromDate) { this.syncFromDate = syncFromDate; }
    
    public Long getTotalEmailsProcessed() { return totalEmailsProcessed; }
    public void setTotalEmailsProcessed(Long totalEmailsProcessed) { this.totalEmailsProcessed = totalEmailsProcessed; }
    
    public Long getTotalTransactionsExtracted() { return totalTransactionsExtracted; }
    public void setTotalTransactionsExtracted(Long totalTransactionsExtracted) { 
        this.totalTransactionsExtracted = totalTransactionsExtracted; 
    }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public boolean isTokenExpired() { return tokenExpired; }
    public void setTokenExpired(boolean tokenExpired) { this.tokenExpired = tokenExpired; }
    
    public boolean isNeedsRefresh() { return needsRefresh; }
    public void setNeedsRefresh(boolean needsRefresh) { this.needsRefresh = needsRefresh; }
    
    // Helper methods
    public String getProviderDisplayName() {
        return switch (provider) {
            case GMAIL -> "Gmail";
            case OUTLOOK -> "Outlook";
            case YAHOO -> "Yahoo";
        };
    }
    
    public String getStatusText() {
        if (!isActive) return "Disconnected";
        if (tokenExpired) return "Token Expired";
        if (needsRefresh) return "Needs Refresh";
        return "Connected";
    }
}