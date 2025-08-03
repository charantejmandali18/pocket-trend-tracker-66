package com.xpend.account.service;

import com.xpend.account.dto.AccountCreateRequest;
import com.xpend.account.entity.Account;
import com.xpend.account.repository.AccountRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@Transactional
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public List<Account> getAllAccounts() {
        log.info("Fetching all accounts");
        return accountRepository.findAll();
    }

    public Account getAccountById(String id) {
        log.info("Fetching account by ID: {}", id);
        try {
            UUID accountId = UUID.fromString(id);
            return accountRepository.findById(accountId)
                    .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid account ID format: " + id, e);
        }
    }

    public Account createAccount(AccountCreateRequest request) {
        log.info("Creating new account: {}", request.getAccountName());
        
        Account account = new Account();
        account.setUserId(1L); // Default user ID for now
        account.setCreatedBy(1L); // Default created by for now
        account.setUpdatedBy(1L); // Default updated by for now
        account.setAccountName(request.getAccountName());
        account.setAccountType(request.getAccountType());
        account.setBankName(request.getBankName());
        account.setBalance(request.getBalance());
        
        if (request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }
        
        account.setIsActive(true);
        account.setCreatedAt(Instant.now());
        account.setUpdatedAt(Instant.now());

        Account savedAccount = accountRepository.save(account);
        log.info("Account created successfully with ID: {}", savedAccount.getId());
        return savedAccount;
    }

    public Account updateAccount(String id, AccountCreateRequest request) {
        log.info("Updating account with ID: {}", id);
        
        Account account = getAccountById(id);
        account.setAccountName(request.getAccountName());
        account.setAccountType(request.getAccountType());
        account.setBankName(request.getBankName());
        account.setBalance(request.getBalance());
        
        if (request.getCreditLimit() != null) {
            account.setCreditLimit(request.getCreditLimit());
        }
        
        account.setUpdatedBy(1L);
        account.setUpdatedAt(Instant.now());

        Account savedAccount = accountRepository.save(account);
        log.info("Account updated successfully with ID: {}", savedAccount.getId());
        return savedAccount;
    }

    public void deleteAccount(String id) {
        log.info("Deleting account with ID: {}", id);
        Account account = getAccountById(id);
        accountRepository.delete(account);
        log.info("Account deleted successfully with ID: {}", id);
    }
}