plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Account Management Service"

dependencies {
    // Financial calculations
    implementation("org.javamoney:moneta:1.4.2")
    implementation("org.javamoney.moneta:moneta-core:1.4.2")
    
    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")
}

tasks.bootJar {
    archiveFileName.set("account-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}