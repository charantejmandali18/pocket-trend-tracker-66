package com.xpend.transaction.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Configuration
public class EncryptionConfig {
    
    @Value("${transaction.encryption.secret-key}")
    private String secretKey;
    
    @Value("${transaction.encryption.algorithm:AES/ECB/PKCS5Padding}")
    private String algorithm;
    
    @Bean
    public SecretKey encryptionKey() {
        // Use the configured secret key, ensuring it's exactly 32 bytes for AES-256
        String paddedKey = String.format("%-32s", secretKey).substring(0, 32);
        return new SecretKeySpec(paddedKey.getBytes(), "AES");
    }
    
    @Bean
    public String encryptionAlgorithm() {
        return algorithm;
    }
    
    /**
     * Utility method to generate a new AES key (for reference only)
     */
    public static String generateNewAESKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(256);
        SecretKey secretKey = keyGenerator.generateKey();
        return Base64.getEncoder().encodeToString(secretKey.getEncoded());
    }
}