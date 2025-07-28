plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Transaction Management Service"

dependencies {
    // CSV processing
    implementation("com.opencsv:opencsv:5.8")
    implementation("org.apache.commons:commons-csv:1.10.0")
    
    // Date/time processing
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    // Batch processing
    implementation("org.springframework.boot:spring-boot-starter-batch")
}

tasks.bootJar {
    archiveFileName.set("transaction-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}