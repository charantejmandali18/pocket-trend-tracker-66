package com.xpend.extraction.util;

import org.jasypt.encryption.StringEncryptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class EncryptionUtil {
    
    private final StringEncryptor stringEncryptor;
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";
    
    @Autowired
    public EncryptionUtil(StringEncryptor stringEncryptor) {
        this.stringEncryptor = stringEncryptor;
    }
    
    /**
     * Encrypts a string using Jasypt encryption
     */
    public String encryptString(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return null;
        }
        return stringEncryptor.encrypt(plainText);
    }
    
    /**
     * Decrypts a string using Jasypt encryption
     */
    public String decryptString(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return null;
        }
        return stringEncryptor.decrypt(encryptedText);
    }
    
    /**
     * Generates a secure random key for additional encryption needs
     */
    public static String generateSecureKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(256);
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate secure key", e);
        }
    }
    
    /**
     * Additional encryption method using AES for sensitive data
     */
    public static String encryptWithAES(String plainText, String key) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                Base64.getDecoder().decode(key), ALGORITHM);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data", e);
        }
    }
    
    /**
     * Decryption method using AES for sensitive data
     */
    public static String decryptWithAES(String encryptedText, String key) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                Base64.getDecoder().decode(key), ALGORITHM);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data", e);
        }
    }
    
    /**
     * Generates a secure random password for OAuth state parameter
     */
    public static String generateSecureRandomString(int length) {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(chars.length());
            sb.append(chars.charAt(randomIndex));
        }
        
        return sb.toString();
    }
    
    /**
     * Masks sensitive data for logging purposes
     */
    public static String maskSensitiveData(String data) {
        if (data == null || data.length() <= 4) {
            return "****";
        }
        return data.substring(0, 2) + "****" + data.substring(data.length() - 2);
    }
    
    /**
     * Validates if a string appears to be encrypted (base64 encoded)
     */
    public static boolean isEncrypted(String data) {
        if (data == null || data.isEmpty()) {
            return false;
        }
        try {
            Base64.getDecoder().decode(data);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}