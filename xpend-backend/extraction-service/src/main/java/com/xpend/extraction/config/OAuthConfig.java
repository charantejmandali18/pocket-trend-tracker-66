package com.xpend.extraction.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@Configuration
@ConfigurationProperties(prefix = "oauth")
public class OAuthConfig {
    
    private Gmail gmail = new Gmail();
    private Outlook outlook = new Outlook();
    private Security security = new Security();
    
    public static class Gmail {
        private String clientId;
        private String clientSecret;
        private String redirectUri = "http://localhost:8089/api/email-auth/callback/gmail";
        
        // Getters and setters
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        
        public String getRedirectUri() { return redirectUri; }
        public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }
    }
    
    public static class Outlook {
        private String clientId;
        private String clientSecret;
        private String redirectUri = "http://localhost:8089/api/email-auth/callback/outlook";
        
        // Getters and setters
        public String getClientId() { return clientId; }
        public void setClientId(String clientId) { this.clientId = clientId; }
        
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        
        public String getRedirectUri() { return redirectUri; }
        public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }
    }
    
    public static class Security {
        private String encryptionKey;
        private String jwtSecret;
        
        // Getters and setters
        public String getEncryptionKey() { return encryptionKey; }
        public void setEncryptionKey(String encryptionKey) { this.encryptionKey = encryptionKey; }
        
        public String getJwtSecret() { return jwtSecret; }
        public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
    }
    
    // Main getters and setters
    public Gmail getGmail() { return gmail; }
    public void setGmail(Gmail gmail) { this.gmail = gmail; }
    
    public Outlook getOutlook() { return outlook; }
    public void setOutlook(Outlook outlook) { this.outlook = outlook; }
    
    public Security getSecurity() { return security; }
    public void setSecurity(Security security) { this.security = security; }
}