package com.xpend.account.controller;

import com.xpend.account.dto.AccountCreateRequest;
import com.xpend.account.entity.Account;
import com.xpend.account.service.AccountService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
@Slf4j
public class AccountController {

    @Autowired
    private AccountService accountService;

    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {
        log.info("GET /api/accounts - Fetching all accounts for user");
        List<Account> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable String id) {
        log.info("GET /api/accounts/{} - Fetching account by ID", id);
        Account account = accountService.getAccountById(id);
        return ResponseEntity.ok(account);
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody AccountCreateRequest request) {
        log.info("POST /api/accounts - Creating new account: {}", request.getAccountName());
        try {
            Account account = accountService.createAccount(request);
            log.info("Account created successfully with ID: {}", account.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(account);
        } catch (Exception e) {
            log.error("Error creating account: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(@PathVariable String id, @RequestBody AccountCreateRequest request) {
        log.info("PUT /api/accounts/{} - Updating account", id);
        Account account = accountService.updateAccount(id, request);
        return ResponseEntity.ok(account);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable String id) {
        log.info("DELETE /api/accounts/{} - Deleting account", id);
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}