plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Notification and Alert Service"

dependencies {
    // Email notifications
    implementation("org.springframework.boot:spring-boot-starter-mail")
    
    // Push notifications
    implementation("com.google.firebase:firebase-admin:9.2.0")
    
    // SMS notifications (via AWS SNS)
    implementation("software.amazon.awssdk:sns")
    
    // Template engine for email templates
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    
    // WebSocket for real-time notifications
    implementation("org.springframework.boot:spring-boot-starter-websocket")
}

tasks.bootJar {
    archiveFileName.set("notification-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}