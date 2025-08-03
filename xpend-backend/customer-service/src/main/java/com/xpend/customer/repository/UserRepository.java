package com.xpend.customer.repository;

import com.xpend.customer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByGoogleId(String googleId);
    
    boolean existsByEmail(String email);
    
    boolean existsByGoogleId(String googleId);
    
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.accountLocked = false")
    Optional<User> findActiveUserByEmail(@Param("email") String email);
    
    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :loginTime WHERE u.id = :userId")
    void updateLastLoginTime(@Param("userId") Long userId, @Param("loginTime") LocalDateTime loginTime);
    
    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = :attempts, u.accountLocked = :locked WHERE u.id = :userId")
    void updateFailedLoginAttempts(@Param("userId") Long userId, @Param("attempts") Integer attempts, @Param("locked") Boolean locked);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countUsersRegisteredSince(@Param("since") LocalDateTime since);
}