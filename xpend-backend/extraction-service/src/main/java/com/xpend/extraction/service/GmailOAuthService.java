package com.xpend.extraction.service;

import com.google.api.client.auth.oauth2.AuthorizationCodeFlow;
import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestFactory;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePart;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.*;

@Service
public class GmailOAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(GmailOAuthService.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "XPend Extraction Service";
    
    @Value("${oauth.gmail.client-id}")
    private String clientId;
    
    @Value("${oauth.gmail.client-secret}")
    private String clientSecret;
    
    @Value("${oauth.gmail.redirect-uri}")
    private String redirectUri;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public String getAuthorizationUrl(String state) {
        try {
            logger.info("=== OAUTH CONFIG DEBUG ===");
            logger.info("Client ID: {}", clientId);
            logger.info("Redirect URI: {}", redirectUri);
            logger.info("Client Secret configured: {}", clientSecret != null && !clientSecret.isEmpty());
            logger.info("=== END CONFIG DEBUG ===");
            
            AuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    clientId,
                    clientSecret,
                    Arrays.asList(GmailScopes.GMAIL_READONLY, "https://www.googleapis.com/auth/userinfo.email"))
                    .setAccessType("offline")
                    .setApprovalPrompt("force")
                    .build();
            
            String authUrl = flow.newAuthorizationUrl()
                    .setRedirectUri(redirectUri)
                    .setState(state)
                    .build();
                    
            logger.debug("Generated Gmail authorization URL with state: {}", state);
            return authUrl;
            
        } catch (Exception e) {
            logger.error("Failed to generate Gmail authorization URL", e);
            throw new RuntimeException("Failed to generate authorization URL", e);
        }
    }
    
    public TokenResponse exchangeCodeForTokens(String code) {
        try {
            logger.debug("Starting token exchange with code: {}", code.substring(0, Math.min(10, code.length())) + "...");
            logger.debug("Using clientId: {}", clientId);
            logger.debug("Using redirectUri: {}", redirectUri);
            logger.debug("Client secret configured: {}", clientSecret != null && !clientSecret.isEmpty());
            
            AuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    clientId,
                    clientSecret,
                    Arrays.asList(GmailScopes.GMAIL_READONLY, "https://www.googleapis.com/auth/userinfo.email"))
                    .build();
            
            var tokenResponse = flow.newTokenRequest(code)
                    .setRedirectUri(redirectUri)
                    .execute();
            
            logger.info("Successfully exchanged code for Gmail tokens");
            
            return new TokenResponse(
                    tokenResponse.getAccessToken(),
                    tokenResponse.getRefreshToken(),
                    tokenResponse.getExpiresInSeconds().intValue()
            );
            
        } catch (Exception e) {
            logger.error("Failed to exchange code for Gmail tokens", e);
            
            // Log the exact error response from Google
            if (e instanceof com.google.api.client.auth.oauth2.TokenResponseException) {
                com.google.api.client.auth.oauth2.TokenResponseException tre = 
                    (com.google.api.client.auth.oauth2.TokenResponseException) e;
                logger.error("=== GOOGLE TOKEN ERROR ===");
                logger.error("Status Code: {}", tre.getStatusCode());
                logger.error("Status Message: {}", tre.getStatusMessage());
                try {
                    logger.error("Error Details: {}", tre.getDetails());
                } catch (Exception ex) {
                    logger.error("Could not get error details: {}", ex.getMessage());
                }
                logger.error("=== END GOOGLE ERROR ===");
            }
            
            throw new RuntimeException("Failed to exchange authorization code: " + e.getMessage(), e);
        }
    }
    
    public String getUserEmail(String accessToken) {
        try {
            HttpRequestFactory requestFactory = GoogleNetHttpTransport.newTrustedTransport()
                    .createRequestFactory();
            
            HttpRequest request = requestFactory.buildGetRequest(
                    new GenericUrl("https://www.googleapis.com/oauth2/v2/userinfo"));
            request.getHeaders().setAuthorization("Bearer " + accessToken);
            
            HttpResponse response = request.execute();
            String responseBody = response.parseAsString();
            
            JsonNode userInfo = objectMapper.readTree(responseBody);
            String email = userInfo.get("email").asText();
            
            logger.info("Retrieved Gmail user email: {}", email);
            return email;
            
        } catch (Exception e) {
            logger.error("Failed to get Gmail user email", e);
            throw new RuntimeException("Failed to get user email", e);
        }
    }
    
    public List<String> getRecentEmails(String accessToken, String query, int maxResults) {
        try {
            Gmail service = new Gmail.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    request -> request.getHeaders().setAuthorization("Bearer " + accessToken))
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            
            ListMessagesResponse response = service.users().messages()
                    .list("me")
                    .setQ(query)
                    .setMaxResults((long) maxResults)
                    .execute();
            
            List<String> messageIds = new ArrayList<>();
            if (response.getMessages() != null) {
                for (Message message : response.getMessages()) {
                    messageIds.add(message.getId());
                }
            }
            
            logger.info("Retrieved {} Gmail message IDs", messageIds.size());
            return messageIds;
            
        } catch (Exception e) {
            logger.error("Failed to get recent Gmail emails", e);
            throw new RuntimeException("Failed to retrieve emails", e);
        }
    }
    
    public EmailMessage getEmailContent(String accessToken, String messageId) {
        try {
            Gmail service = new Gmail.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JSON_FACTORY,
                    request -> request.getHeaders().setAuthorization("Bearer " + accessToken))
                    .setApplicationName(APPLICATION_NAME)
                    .build();
            
            Message message = service.users().messages().get("me", messageId).execute();
            
            EmailMessage emailMessage = new EmailMessage();
            emailMessage.setMessageId(messageId);
            emailMessage.setInternalDate(new Date(message.getInternalDate()));
            
            // Extract headers
            Map<String, String> headers = new HashMap<>();
            if (message.getPayload() != null && message.getPayload().getHeaders() != null) {
                for (MessagePartHeader header : message.getPayload().getHeaders()) {
                    headers.put(header.getName().toLowerCase(), header.getValue());
                }
            }
            
            emailMessage.setSubject(headers.get("subject"));
            emailMessage.setSender(headers.get("from"));
            emailMessage.setHeaders(headers);
            
            // Extract body content
            String body = extractBodyContent(message.getPayload());
            emailMessage.setBody(body);
            
            logger.debug("Extracted Gmail message content for ID: {}", messageId);
            return emailMessage;
            
        } catch (Exception e) {
            logger.error("Failed to get Gmail message content for ID: {}", messageId, e);
            throw new RuntimeException("Failed to get email content", e);
        }
    }
    
    private String extractBodyContent(MessagePart part) {
        StringBuilder content = new StringBuilder();
        
        if (part.getBody() != null && part.getBody().getData() != null) {
            byte[] data = Base64.getUrlDecoder().decode(part.getBody().getData());
            content.append(new String(data));
        }
        
        if (part.getParts() != null) {
            for (MessagePart subPart : part.getParts()) {
                content.append(extractBodyContent(subPart));
            }
        }
        
        return content.toString();
    }
    
    public TokenResponse refreshAccessToken(String refreshToken) {
        try {
            HttpRequestFactory requestFactory = GoogleNetHttpTransport.newTrustedTransport()
                    .createRequestFactory();
            
            GenericUrl tokenUrl = new GenericUrl("https://oauth2.googleapis.com/token");
            
            Map<String, String> params = new HashMap<>();
            params.put("client_id", clientId);
            params.put("client_secret", clientSecret);
            params.put("refresh_token", refreshToken);
            params.put("grant_type", "refresh_token");
            
            StringBuilder postData = new StringBuilder();
            for (Map.Entry<String, String> param : params.entrySet()) {
                if (postData.length() != 0) postData.append('&');
                postData.append(param.getKey()).append('=').append(param.getValue());
            }
            
            HttpRequest request = requestFactory.buildPostRequest(tokenUrl, 
                    com.google.api.client.http.ByteArrayContent.fromString("application/x-www-form-urlencoded", postData.toString()));
            
            HttpResponse response = request.execute();
            String responseBody = response.parseAsString();
            
            JsonNode tokenData = objectMapper.readTree(responseBody);
            
            logger.info("Successfully refreshed Gmail access token");
            
            return new TokenResponse(
                    tokenData.get("access_token").asText(),
                    tokenData.has("refresh_token") ? tokenData.get("refresh_token").asText() : refreshToken,
                    tokenData.get("expires_in").asInt()
            );
            
        } catch (Exception e) {
            logger.error("Failed to refresh Gmail access token", e);
            throw new RuntimeException("Failed to refresh access token", e);
        }
    }
    
    // DTO classes
    public static class TokenResponse {
        private final String accessToken;
        private final String refreshToken;
        private final int expiresIn;
        
        public TokenResponse(String accessToken, String refreshToken, int expiresIn) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
        }
        
        public String getAccessToken() { return accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public int getExpiresIn() { return expiresIn; }
    }
    
    public static class EmailMessage {
        private String messageId;
        private Date internalDate;
        private String subject;
        private String sender;
        private String body;
        private Map<String, String> headers;
        
        // Getters and setters
        public String getMessageId() { return messageId; }
        public void setMessageId(String messageId) { this.messageId = messageId; }
        
        public Date getInternalDate() { return internalDate; }
        public void setInternalDate(Date internalDate) { this.internalDate = internalDate; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
        
        public Map<String, String> getHeaders() { return headers; }
        public void setHeaders(Map<String, String> headers) { this.headers = headers; }
    }
}