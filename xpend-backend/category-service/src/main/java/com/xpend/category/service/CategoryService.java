package com.xpend.category.service;

import com.xpend.category.entity.Category;
import com.xpend.category.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories(String type, Long userId, UUID groupId) {
        if (userId != null && groupId != null) {
            return categoryRepository.findAvailableCategories(userId, groupId);
        } else if (userId != null) {
            if (type != null) {
                Category.CategoryType categoryType = Category.CategoryType.valueOf(type.toUpperCase());
                return categoryRepository.findByUserIdAndCategoryTypeAndIsActiveTrue(userId, categoryType);
            }
            return categoryRepository.findByUserIdAndIsActiveTrue(userId);
        } else if (groupId != null) {
            if (type != null) {
                Category.CategoryType categoryType = Category.CategoryType.valueOf(type.toUpperCase());
                return categoryRepository.findByGroupIdAndCategoryTypeAndIsActiveTrue(groupId, categoryType);
            }
            return categoryRepository.findByGroupIdAndIsActiveTrue(groupId);
        } else {
            // Return system default categories
            return categoryRepository.findByIsSystemDefaultTrueAndIsActiveTrue();
        }
    }

    public Category getCategoryById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(UUID id, Category category) {
        Category existingCategory = getCategoryById(id);
        
        existingCategory.setName(category.getName());
        existingCategory.setDescription(category.getDescription());
        existingCategory.setColor(category.getColor());
        existingCategory.setIcon(category.getIcon());
        existingCategory.setCategoryType(category.getCategoryType());
        existingCategory.setIsActive(category.getIsActive());
        existingCategory.setUpdatedBy(category.getUpdatedBy());
        
        return categoryRepository.save(existingCategory);
    }

    public void deleteCategory(UUID id) {
        Category category = getCategoryById(id);
        category.setIsActive(false); // Soft delete
        categoryRepository.save(category);
    }
}