plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "File Upload and Import Service"

dependencies {
    // File processing
    implementation("org.apache.commons:commons-csv:1.10.0")
    implementation("com.opencsv:opencsv:5.8")
    
    // Image processing
    implementation("net.coobird:thumbnailator:0.4.19")
    
    // OCR for receipts
    implementation("net.sourceforge.tess4j:tess4j:5.8.0")
    
    // File type detection
    implementation("org.apache.tika:tika-core:2.9.1")
    implementation("org.apache.tika:tika-parsers-standard-package:2.9.1")
    
    // Multipart file handling
    implementation("org.springframework.boot:spring-boot-starter-web")
}

tasks.bootJar {
    archiveFileName.set("file-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}