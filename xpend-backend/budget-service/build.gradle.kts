plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Budget Planning and Analysis Service"

dependencies {
    // Financial calculations
    implementation("org.javamoney:moneta:1.4.2")
    implementation("org.javamoney.moneta:moneta-core:1.4.2")
    
    // Scheduler
    implementation("org.springframework.boot:spring-boot-starter-quartz")
    
    // Analytics
    implementation("org.apache.commons:commons-math3:3.6.1")
}

tasks.bootJar {
    archiveFileName.set("budget-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}