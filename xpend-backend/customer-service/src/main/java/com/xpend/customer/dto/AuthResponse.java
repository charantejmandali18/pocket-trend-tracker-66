package com.xpend.customer.dto;

import com.xpend.customer.entity.User;
import java.util.Set;

public class AuthResponse {
    
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType = "Bearer";
    
    // User information
    private Long userId;
    private String email;
    private String fullName;
    private String profilePictureUrl;
    private Set<User.Role> roles;
    
    // Constructors
    public AuthResponse() {}
    
    public AuthResponse(String accessToken, String refreshToken, long expiresIn, 
                       Long userId, String email, String fullName, 
                       String profilePictureUrl, Set<User.Role> roles) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.profilePictureUrl = profilePictureUrl;
        this.roles = roles;
    }
    
    // Getters and Setters
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
    
    public Set<User.Role> getRoles() { return roles; }
    public void setRoles(Set<User.Role> roles) { this.roles = roles; }
    
    @Override
    public String toString() {
        return "AuthResponse{" +
                "accessToken='[PROTECTED]'" +
                ", refreshToken='[PROTECTED]'" +
                ", expiresIn=" + expiresIn +
                ", tokenType='" + tokenType + '\'' +
                ", userId=" + userId +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", profilePictureUrl='" + profilePictureUrl + '\'' +
                ", roles=" + roles +
                '}';
    }
}