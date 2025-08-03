package com.xpend.transaction.controller;

import com.xpend.transaction.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get complete dashboard data with all calculations
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        logger.debug("Fetching dashboard overview for user: {}", userId);
        
        Map<String, Object> dashboardData = dashboardService.getDashboardOverview(userId, startDate, endDate);
        
        return ResponseEntity.ok(dashboardData);
    }

    /**
     * Get financial summary (income, expenses, balance)
     */
    @GetMapping("/financial-summary")
    public ResponseEntity<Map<String, Object>> getFinancialSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        logger.debug("Fetching financial summary for user: {}", userId);
        
        Map<String, Object> summary = dashboardService.getFinancialSummary(userId, startDate, endDate);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Get category breakdown with calculations
     */
    @GetMapping("/category-breakdown")
    public ResponseEntity<Map<String, Object>> getCategoryBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        logger.debug("Fetching category breakdown for user: {}", userId);
        
        Map<String, Object> breakdown = dashboardService.getCategoryBreakdown(userId, startDate, endDate);
        
        return ResponseEntity.ok(breakdown);
    }

    /**
     * Get monthly projections and analytics
     */
    @GetMapping("/monthly-projections")
    public ResponseEntity<Map<String, Object>> getMonthlyProjections(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        logger.debug("Fetching monthly projections for user: {}", userId);
        
        Map<String, Object> projections = dashboardService.getMonthlyProjections(userId, month);
        
        return ResponseEntity.ok(projections);
    }

    /**
     * Get recent transactions formatted for display
     */
    @GetMapping("/recent-transactions")
    public ResponseEntity<Map<String, Object>> getRecentTransactions(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        logger.debug("Fetching recent transactions for user: {}", userId);
        
        Map<String, Object> recentTransactions = dashboardService.getRecentTransactions(userId, limit);
        
        return ResponseEntity.ok(recentTransactions);
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        return Long.valueOf(authentication.getName());
    }
}