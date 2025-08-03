package com.xpend.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;
    
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&].*$",
        message = "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
    )
    private String password;
    
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
    
    // Constructors
    public RegisterRequest() {}
    
    public RegisterRequest(String email, String fullName, String password, String confirmPassword) {
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.confirmPassword = confirmPassword;
    }
    
    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    
    // Validation helper
    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }
    
    @Override
    public String toString() {
        return "RegisterRequest{" +
                "email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", password='[PROTECTED]'" +
                ", confirmPassword='[PROTECTED]'" +
                '}';
    }
}