plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Category Management Service"

dependencies {
    // Tree structure support
    implementation("org.springframework.boot:spring-boot-starter-validation")
    
    // Hierarchical data
    implementation("com.fasterxml.jackson.core:jackson-databind")
}

tasks.bootJar {
    archiveFileName.set("category-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}