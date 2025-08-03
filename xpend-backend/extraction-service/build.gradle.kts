plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

group = "com.xpend"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-mail") 
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    
    // Database
    runtimeOnly("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    
    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    implementation("io.jsonwebtoken:jjwt-impl:0.11.5")
    implementation("io.jsonwebtoken:jjwt-jackson:0.11.5")
    
    // Google APIs
    implementation("com.google.apis:google-api-services-gmail:v1-rev20220404-2.0.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.19.0")
    
    // Microsoft Graph API (using available version)
    implementation("com.microsoft.graph:microsoft-graph:6.8.0")
    
    // Email parsing
    implementation("com.sun.mail:jakarta.mail:2.0.1")
    implementation("org.jsoup:jsoup:1.17.2")
    
    // Encryption (using available version)
    implementation("com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.5")
    
    // JSON Processing
    implementation("com.fasterxml.jackson.core:jackson-databind")
    
    // HTTP Client
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    
    // Logging
    implementation("org.springframework.boot:spring-boot-starter-logging")
    
    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> {
    useJUnitPlatform()
}