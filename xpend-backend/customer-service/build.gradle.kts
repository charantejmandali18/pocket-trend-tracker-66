plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Customer Service - Authentication, User Management, and Customer Data"

dependencies {
    // Additional auth-specific dependencies
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.session:spring-session-data-redis")
    
    // Google OAuth
    implementation("com.google.api-client:google-api-client:2.2.0")
    implementation("com.google.oauth-client:google-oauth-client-jetty:1.34.1")
    implementation("com.google.apis:google-api-services-oauth2:v2-rev20200213-2.0.0")
    
    // Rate limiting
    implementation("com.github.vladimir-bukhtoyarov:bucket4j-core:7.6.0")
    implementation("com.github.vladimir-bukhtoyarov:bucket4j-redis:7.6.0")
    
    // Password encoding
    implementation("org.springframework.security:spring-security-crypto")
    
    // Email service
    implementation("org.springframework.boot:spring-boot-starter-mail")
}

tasks.bootJar {
    archiveFileName.set("customer-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}