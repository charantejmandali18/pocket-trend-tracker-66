package com.xpend.transaction.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {
    
    @Bean
    public AuditorAware<String> auditorProvider() {
        return new AuditorAwareImpl();
    }
    
    public static class AuditorAwareImpl implements AuditorAware<String> {
        
        @Override
        public Optional<String> getCurrentAuditor() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("system");
            }
            
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> userInfo = (Map<String, Object>) principal;
                Object userId = userInfo.get("userId");
                if (userId != null) {
                    return Optional.of("user:" + userId.toString());
                }
            }
            
            return Optional.of(authentication.getName());
        }
    }
}