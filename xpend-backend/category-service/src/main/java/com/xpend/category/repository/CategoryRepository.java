package com.xpend.category.repository;

import com.xpend.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByUserIdAndIsActiveTrue(Long userId);
    
    List<Category> findByGroupIdAndIsActiveTrue(UUID groupId);
    
    List<Category> findByUserIdAndCategoryTypeAndIsActiveTrue(Long userId, Category.CategoryType categoryType);
    
    List<Category> findByGroupIdAndCategoryTypeAndIsActiveTrue(UUID groupId, Category.CategoryType categoryType);
    
    List<Category> findByIsSystemDefaultTrueAndIsActiveTrue();
    
    @Query("SELECT c FROM Category c WHERE c.isSystemDefault = true OR c.userId = :userId OR c.groupId = :groupId")
    List<Category> findAvailableCategories(@Param("userId") Long userId, @Param("groupId") UUID groupId);
}