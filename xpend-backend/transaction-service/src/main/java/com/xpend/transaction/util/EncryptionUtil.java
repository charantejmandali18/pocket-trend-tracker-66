package com.xpend.transaction.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import java.util.Base64;

@Component
public class EncryptionUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(EncryptionUtil.class);
    
    @Autowired
    private SecretKey encryptionKey;
    
    @Autowired
    private String encryptionAlgorithm;
    
    /**
     * Encrypts a string value
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        
        try {
            Cipher cipher = Cipher.getInstance(encryptionAlgorithm);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            logger.error("Error encrypting data", e);
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }
    
    /**
     * Decrypts a string value
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        
        try {
            Cipher cipher = Cipher.getInstance(encryptionAlgorithm);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decryptedBytes);
        } catch (Exception e) {
            logger.error("Error decrypting data", e);
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }
}