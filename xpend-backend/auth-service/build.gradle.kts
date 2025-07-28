plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Authentication and Authorization Service"

dependencies {
    // Additional auth-specific dependencies
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.session:spring-session-data-redis")
    
    // Password encoding
    implementation("org.springframework.security:spring-security-crypto")
    
    // Email service
    implementation("org.springframework.boot:spring-boot-starter-mail")
}

tasks.bootJar {
    archiveFileName.set("auth-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}