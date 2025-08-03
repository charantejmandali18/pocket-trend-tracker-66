package com.xpend.customer.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {
    
    private final ConcurrentHashMap<String, Bucket> cache = new ConcurrentHashMap<>();
    
    @Bean
    public ConcurrentHashMap<String, Bucket> rateLimitCache() {
        return cache;
    }
    
    public Bucket createLoginRateLimitBucket() {
        // Allow 5 login attempts per minute per IP
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    public Bucket createRegistrationRateLimitBucket() {
        // Allow 3 registration attempts per hour per IP
        Bandwidth limit = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    public Bucket createTokenRefreshRateLimitBucket() {
        // Allow 10 token refresh attempts per minute per user
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    public Bucket createPasswordResetRateLimitBucket() {
        // Allow 3 password reset attempts per hour per email
        Bandwidth limit = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
    
    public Bucket resolveBucket(String key, String bucketType) {
        return cache.computeIfAbsent(key, k -> {
            switch (bucketType) {
                case "login":
                    return createLoginRateLimitBucket();
                case "registration":
                    return createRegistrationRateLimitBucket();
                case "token-refresh":
                    return createTokenRefreshRateLimitBucket();
                case "password-reset":
                    return createPasswordResetRateLimitBucket();
                default:
                    // Default generic rate limit
                    Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
                    return Bucket.builder().addLimit(limit).build();
            }
        });
    }
}