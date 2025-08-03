package com.xpend.extraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class OutlookOAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(OutlookOAuthService.class);
    private static final String AUTHORIZATION_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    private static final String TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    private static final String GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
    
    @Value("${oauth.outlook.client-id}")
    private String clientId;
    
    @Value("${oauth.outlook.client-secret}")
    private String clientSecret;
    
    @Value("${oauth.outlook.redirect-uri}")
    private String redirectUri;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public String getAuthorizationUrl(String state) {
        try {
            String scopes = "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read";
            
            String authUrl = UriComponentsBuilder.fromHttpUrl(AUTHORIZATION_URL)
                    .queryParam("client_id", clientId)
                    .queryParam("response_type", "code")
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("scope", scopes)
                    .queryParam("state", state)
                    .queryParam("response_mode", "query")
                    .build()
                    .toUriString();
                    
            logger.debug("Generated Outlook authorization URL with state: {}", state);
            return authUrl;
            
        } catch (Exception e) {
            logger.error("Failed to generate Outlook authorization URL", e);
            throw new RuntimeException("Failed to generate authorization URL", e);
        }
    }
    
    public GmailOAuthService.TokenResponse exchangeCodeForTokens(String code) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("code", code);
            body.add("redirect_uri", redirectUri);
            body.add("grant_type", "authorization_code");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(TOKEN_URL, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode tokenData = objectMapper.readTree(response.getBody());
                
                String accessToken = tokenData.get("access_token").asText();
                String refreshToken = tokenData.has("refresh_token") ? 
                        tokenData.get("refresh_token").asText() : null;
                int expiresIn = tokenData.get("expires_in").asInt();
                
                logger.info("Successfully exchanged code for Outlook tokens");
                
                return new GmailOAuthService.TokenResponse(accessToken, refreshToken, expiresIn);
            } else {
                throw new RuntimeException("Failed to exchange code: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to exchange code for Outlook tokens", e);
            throw new RuntimeException("Failed to exchange authorization code", e);
        }
    }
    
    public String getUserEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    GRAPH_API_BASE + "/me",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode userData = objectMapper.readTree(response.getBody());
                String email = userData.get("mail").asText();
                
                if (email == null || email.isEmpty()) {
                    email = userData.get("userPrincipalName").asText();
                }
                
                logger.info("Retrieved Outlook user email: {}", email);
                return email;
            } else {
                throw new RuntimeException("Failed to get user info: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to get Outlook user email", e);
            throw new RuntimeException("Failed to get user email", e);
        }
    }
    
    public List<String> getRecentEmails(String accessToken, String filter, int maxResults) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(GRAPH_API_BASE + "/me/messages")
                    .queryParam("$top", maxResults)
                    .queryParam("$select", "id,subject,from,receivedDateTime")
                    .queryParam("$orderby", "receivedDateTime desc");
            
            if (filter != null && !filter.isEmpty()) {
                uriBuilder = uriBuilder.queryParam("$filter", filter);
            }
            
            String url = uriBuilder.build().toUriString();
            
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseData = objectMapper.readTree(response.getBody());
                JsonNode messages = responseData.get("value");
                
                List<String> messageIds = new ArrayList<>();
                if (messages.isArray()) {
                    for (JsonNode message : messages) {
                        messageIds.add(message.get("id").asText());
                    }
                }
                
                logger.info("Retrieved {} Outlook message IDs", messageIds.size());
                return messageIds;
            } else {
                throw new RuntimeException("Failed to get messages: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to get recent Outlook emails", e);
            throw new RuntimeException("Failed to retrieve emails", e);
        }
    }
    
    public OutlookEmailMessage getEmailContent(String accessToken, String messageId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = GRAPH_API_BASE + "/me/messages/" + messageId;
            
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode messageData = objectMapper.readTree(response.getBody());
                
                OutlookEmailMessage emailMessage = new OutlookEmailMessage();
                emailMessage.setMessageId(messageId);
                emailMessage.setSubject(messageData.get("subject").asText());
                
                // Parse sender
                if (messageData.has("from") && messageData.get("from").has("emailAddress")) {
                    String sender = messageData.get("from").get("emailAddress").get("address").asText();
                    emailMessage.setSender(sender);
                }
                
                // Parse received date
                if (messageData.has("receivedDateTime")) {
                    String dateTimeStr = messageData.get("receivedDateTime").asText();
                    Instant instant = Instant.parse(dateTimeStr);
                    emailMessage.setReceivedDateTime(LocalDateTime.ofInstant(instant, ZoneOffset.UTC));
                }
                
                // Parse body content
                if (messageData.has("body")) {
                    JsonNode body = messageData.get("body");
                    String content = body.get("content").asText();
                    String contentType = body.get("contentType").asText();
                    
                    emailMessage.setBody(content);
                    emailMessage.setBodyType(contentType);
                }
                
                // Store raw message data
                emailMessage.setRawMessageData(response.getBody());
                
                logger.debug("Extracted Outlook message content for ID: {}", messageId);
                return emailMessage;
            } else {
                throw new RuntimeException("Failed to get message: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to get Outlook message content for ID: {}", messageId, e);
            throw new RuntimeException("Failed to get email content", e);
        }
    }
    
    public GmailOAuthService.TokenResponse refreshAccessToken(String refreshToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("refresh_token", refreshToken);
            body.add("grant_type", "refresh_token");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(TOKEN_URL, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode tokenData = objectMapper.readTree(response.getBody());
                
                String accessToken = tokenData.get("access_token").asText();
                String newRefreshToken = tokenData.has("refresh_token") ? 
                        tokenData.get("refresh_token").asText() : refreshToken;
                int expiresIn = tokenData.get("expires_in").asInt();
                
                logger.info("Successfully refreshed Outlook access token");
                
                return new GmailOAuthService.TokenResponse(accessToken, newRefreshToken, expiresIn);
            } else {
                throw new RuntimeException("Failed to refresh token: " + response.getBody());
            }
            
        } catch (Exception e) {
            logger.error("Failed to refresh Outlook access token", e);
            throw new RuntimeException("Failed to refresh access token", e);
        }
    }
    
    // DTO class for Outlook emails
    public static class OutlookEmailMessage {
        private String messageId;
        private String subject;
        private String sender;
        private String body;
        private String bodyType;
        private LocalDateTime receivedDateTime;
        private String rawMessageData;
        
        // Getters and setters
        public String getMessageId() { return messageId; }
        public void setMessageId(String messageId) { this.messageId = messageId; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
        
        public String getBodyType() { return bodyType; }
        public void setBodyType(String bodyType) { this.bodyType = bodyType; }
        
        public LocalDateTime getReceivedDateTime() { return receivedDateTime; }
        public void setReceivedDateTime(LocalDateTime receivedDateTime) { this.receivedDateTime = receivedDateTime; }
        
        public String getRawMessageData() { return rawMessageData; }
        public void setRawMessageData(String rawMessageData) { this.rawMessageData = rawMessageData; }
    }
}