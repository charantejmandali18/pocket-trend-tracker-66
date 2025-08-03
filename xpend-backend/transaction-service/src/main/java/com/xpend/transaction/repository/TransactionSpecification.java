package com.xpend.transaction.repository;

import com.xpend.transaction.dto.TransactionSearchCriteria;
import com.xpend.transaction.entity.Transaction;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specification builder for dynamic Transaction queries
 */
public class TransactionSpecification {
    
    /**
     * Build specification based on search criteria
     */
    public static Specification<Transaction> buildSpecification(TransactionSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // User isolation - ALWAYS required
            if (criteria.getUserId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("userId"), criteria.getUserId()));
            }
            
            // Transaction type filter
            if (criteria.getTransactionType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("transactionType"), criteria.getTransactionType()));
            }
            
            // Category filters
            if (criteria.getCategoryIds() != null && !criteria.getCategoryIds().isEmpty()) {
                predicates.add(root.get("categoryId").in(criteria.getCategoryIds()));
            }
            
            // Payment method filters
            if (criteria.getPaymentMethods() != null && !criteria.getPaymentMethods().isEmpty()) {
                predicates.add(root.get("paymentMethod").in(criteria.getPaymentMethods()));
            }
            
            // Source filters
            if (criteria.getSources() != null && !criteria.getSources().isEmpty()) {
                predicates.add(root.get("source").in(criteria.getSources()));
            }
            
            // Amount range filters
            if (criteria.getMinAmount() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), criteria.getMinAmount()));
            }
            if (criteria.getMaxAmount() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amount"), criteria.getMaxAmount()));
            }
            
            // Date range filters
            LocalDate fromDate = criteria.getFromDate();
            LocalDate toDate = criteria.getToDate();
            
            // Handle date range presets
            if (criteria.getDateRangePreset() != null) {
                LocalDate[] dateRange = getDateRangeFromPreset(criteria.getDateRangePreset());
                fromDate = dateRange[0];
                toDate = dateRange[1];
            }
            
            if (fromDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), toDate));
            }
            
            // Group transaction filters
            if (criteria.getGroupId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("groupId"), criteria.getGroupId()));
            } else if (criteria.getIsGroupTransaction() != null) {
                if (criteria.getIsGroupTransaction()) {
                    predicates.add(criteriaBuilder.isNotNull(root.get("groupId")));
                } else {
                    predicates.add(criteriaBuilder.isNull(root.get("groupId")));
                }
            }
            
            // Member email filter
            if (criteria.getMemberEmail() != null && !criteria.getMemberEmail().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("memberEmail"), criteria.getMemberEmail().trim()));
            }
            
            // Text search filters (Note: These work on encrypted data, so exact matches only)
            if (criteria.getDescriptionKeyword() != null && !criteria.getDescriptionKeyword().trim().isEmpty()) {
                String keyword = "%" + criteria.getDescriptionKeyword().trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("description")), keyword));
            }
            
            if (criteria.getAccountNameKeyword() != null && !criteria.getAccountNameKeyword().trim().isEmpty()) {
                String keyword = "%" + criteria.getAccountNameKeyword().trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("accountName")), keyword));
            }
            
            if (criteria.getNotesKeyword() != null && !criteria.getNotesKeyword().trim().isEmpty()) {
                String keyword = "%" + criteria.getNotesKeyword().trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("notes")), keyword));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Get date range from preset
     */
    private static LocalDate[] getDateRangeFromPreset(TransactionSearchCriteria.DateRangePreset preset) {
        LocalDate now = LocalDate.now();
        LocalDate fromDate = null;
        LocalDate toDate = now;
        
        switch (preset) {
            case TODAY:
                fromDate = now;
                toDate = now;
                break;
            case YESTERDAY:
                fromDate = now.minusDays(1);
                toDate = now.minusDays(1);
                break;
            case THIS_WEEK:
                fromDate = now.with(java.time.DayOfWeek.MONDAY);
                break;
            case LAST_WEEK:
                fromDate = now.with(java.time.DayOfWeek.MONDAY).minusWeeks(1);
                toDate = now.with(java.time.DayOfWeek.SUNDAY).minusWeeks(1);
                break;
            case THIS_MONTH:
                fromDate = now.withDayOfMonth(1);
                break;
            case LAST_MONTH:
                fromDate = now.minusMonths(1).withDayOfMonth(1);
                toDate = now.withDayOfMonth(1).minusDays(1);
                break;
            case THIS_QUARTER:
                fromDate = getQuarterStart(now);
                break;
            case LAST_QUARTER:
                LocalDate lastQuarterStart = getQuarterStart(now.minusMonths(3));
                fromDate = lastQuarterStart;
                toDate = lastQuarterStart.plusMonths(3).minusDays(1);
                break;
            case THIS_YEAR:
                fromDate = now.withDayOfYear(1);
                break;
            case LAST_YEAR:
                fromDate = now.minusYears(1).withDayOfYear(1);
                toDate = now.minusYears(1).withMonth(12).withDayOfMonth(31);
                break;
            case LAST_7_DAYS:
                fromDate = now.minusDays(6);
                break;
            case LAST_30_DAYS:
                fromDate = now.minusDays(29);
                break;
            case LAST_90_DAYS:
                fromDate = now.minusDays(89);
                break;
        }
        
        return new LocalDate[]{fromDate, toDate};
    }
    
    /**
     * Get the start of the quarter for a given date
     */
    private static LocalDate getQuarterStart(LocalDate date) {
        int month = date.getMonthValue();
        int quarterStartMonth = ((month - 1) / 3) * 3 + 1;
        return date.withMonth(quarterStartMonth).withDayOfMonth(1);
    }
    
    /**
     * Build specification for user isolation only
     */
    public static Specification<Transaction> belongsToUser(Long userId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("userId"), userId);
    }
    
    /**
     * Build specification for recent transactions
     */
    public static Specification<Transaction> isRecent(Long userId, int days) {
        return (root, query, criteriaBuilder) -> {
            LocalDate cutoffDate = LocalDate.now().minusDays(days);
            return criteriaBuilder.and(
                criteriaBuilder.equal(root.get("userId"), userId),
                criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), cutoffDate)
            );
        };
    }
    
    /**
     * Build specification for transactions in date range
     */
    public static Specification<Transaction> inDateRange(Long userId, LocalDate fromDate, LocalDate toDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("userId"), userId));
            
            if (fromDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), toDate));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}