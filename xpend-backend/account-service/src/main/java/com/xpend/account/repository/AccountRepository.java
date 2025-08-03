package com.xpend.account.repository;

import com.xpend.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    
    List<Account> findByUserId(Long userId);
    
    List<Account> findByUserIdAndIsActive(Long userId, Boolean isActive);
    
    @Query("SELECT a FROM Account a WHERE a.userId = :userId AND a.accountType = :type")
    List<Account> findByUserIdAndType(@Param("userId") Long userId, @Param("type") Account.AccountType type);
    
    @Query("SELECT COUNT(a) FROM Account a WHERE a.userId = :userId AND a.isActive = true")
    Long countActiveAccountsByUserId(@Param("userId") Long userId);
}