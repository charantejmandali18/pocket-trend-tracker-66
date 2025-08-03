package com.xpend.extraction.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_accounts", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_provider_email", columnList = "provider, email_address")
})
public class EmailAccount {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmailProvider provider;
    
    @Column(name = "email_address", nullable = false)
    private String emailAddress;
    
    @Column(name = "encrypted_access_token", columnDefinition = "TEXT")
    private String encryptedAccessToken;
    
    @Column(name = "encrypted_refresh_token", columnDefinition = "TEXT")
    private String encryptedRefreshToken;
    
    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;
    
    @Column(name = "sync_from_date")
    private LocalDateTime syncFromDate;
    
    @Column(name = "total_emails_processed")
    private Long totalEmailsProcessed = 0L;
    
    @Column(name = "total_transactions_extracted")
    private Long totalTransactionsExtracted = 0L;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Constructors
    public EmailAccount() {}
    
    public EmailAccount(Long userId, EmailProvider provider, String emailAddress) {
        this.userId = userId;
        this.provider = provider;
        this.emailAddress = emailAddress;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public EmailProvider getProvider() { return provider; }
    public void setProvider(EmailProvider provider) { this.provider = provider; }
    
    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }
    
    public String getEncryptedAccessToken() { return encryptedAccessToken; }
    public void setEncryptedAccessToken(String encryptedAccessToken) { this.encryptedAccessToken = encryptedAccessToken; }
    
    public String getEncryptedRefreshToken() { return encryptedRefreshToken; }
    public void setEncryptedRefreshToken(String encryptedRefreshToken) { this.encryptedRefreshToken = encryptedRefreshToken; }
    
    public LocalDateTime getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(LocalDateTime tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    
    public LocalDateTime getSyncFromDate() { return syncFromDate; }
    public void setSyncFromDate(LocalDateTime syncFromDate) { this.syncFromDate = syncFromDate; }
    
    public Long getTotalEmailsProcessed() { return totalEmailsProcessed; }
    public void setTotalEmailsProcessed(Long totalEmailsProcessed) { this.totalEmailsProcessed = totalEmailsProcessed; }
    
    public Long getTotalTransactionsExtracted() { return totalTransactionsExtracted; }
    public void setTotalTransactionsExtracted(Long totalTransactionsExtracted) { this.totalTransactionsExtracted = totalTransactionsExtracted; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public boolean isTokenExpired() {
        return tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now());
    }
    
    public boolean needsRefresh() {
        return tokenExpiresAt != null && tokenExpiresAt.isBefore(LocalDateTime.now().plusMinutes(5));
    }
}

