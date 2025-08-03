package com.xpend.extraction.repository;

import com.xpend.extraction.entity.EmailAccount;
import com.xpend.extraction.entity.EmailProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailAccountRepository extends JpaRepository<EmailAccount, Long> {
    
    List<EmailAccount> findByUserId(Long userId);
    
    List<EmailAccount> findByUserIdAndIsActive(Long userId, Boolean isActive);
    
    Optional<EmailAccount> findByUserIdAndProviderAndEmailAddress(
            Long userId, EmailProvider provider, String emailAddress);
    
    List<EmailAccount> findByProviderAndIsActive(EmailProvider provider, Boolean isActive);
    
    @Query("SELECT ea FROM EmailAccount ea WHERE ea.isActive = true AND ea.tokenExpiresAt < :currentTime")
    List<EmailAccount> findAccountsWithExpiredTokens(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT ea FROM EmailAccount ea WHERE ea.isActive = true AND " +
           "(ea.lastSyncAt IS NULL OR ea.lastSyncAt < :cutoffTime)")
    List<EmailAccount> findAccountsNeedingSync(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    @Modifying
    @Query("UPDATE EmailAccount ea SET ea.lastSyncAt = :syncTime, " +
           "ea.totalEmailsProcessed = ea.totalEmailsProcessed + :emailsProcessed, " +
           "ea.totalTransactionsExtracted = ea.totalTransactionsExtracted + :transactionsExtracted " +
           "WHERE ea.id = :accountId")
    void updateSyncStats(@Param("accountId") Long accountId,
                        @Param("syncTime") LocalDateTime syncTime,
                        @Param("emailsProcessed") Long emailsProcessed,
                        @Param("transactionsExtracted") Long transactionsExtracted);
    
    @Modifying
    @Query("UPDATE EmailAccount ea SET ea.encryptedAccessToken = :newAccessToken, " +
           "ea.tokenExpiresAt = :newExpiresAt WHERE ea.id = :accountId")
    void updateAccessToken(@Param("accountId") Long accountId,
                          @Param("newAccessToken") String newAccessToken,
                          @Param("newExpiresAt") LocalDateTime newExpiresAt);
    
    @Query("SELECT COUNT(ea) FROM EmailAccount ea WHERE ea.userId = :userId AND ea.isActive = true")
    long countActiveAccountsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT SUM(ea.totalTransactionsExtracted) FROM EmailAccount ea WHERE ea.userId = :userId")
    Long getTotalTransactionsExtractedByUserId(@Param("userId") Long userId);
}