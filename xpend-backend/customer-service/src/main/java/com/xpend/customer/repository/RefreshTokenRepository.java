package com.xpend.customer.repository;

import com.xpend.customer.entity.RefreshToken;
import com.xpend.customer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token AND rt.revoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);
    
    List<RefreshToken> findByUserAndRevokedFalse(User user);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user")
    void revokeAllUserTokens(@Param("user") User user);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
    void revokeToken(@Param("token") String token);
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now OR rt.revoked = true")
    void deleteExpiredAndRevokedTokens(@Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.expiresAt > :now")
    long countValidTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);
}