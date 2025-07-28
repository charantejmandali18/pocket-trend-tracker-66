plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Group Expense Sharing Service"

dependencies {
    // Email for invitations
    implementation("org.springframework.boot:spring-boot-starter-mail")
    
    // Financial calculations
    implementation("org.javamoney:moneta:1.4.2")
    implementation("org.javamoney.moneta:moneta-core:1.4.2")
    
    // QR code generation for group invites
    implementation("com.google.zxing:core:3.5.2")
    implementation("com.google.zxing:javase:3.5.2")
}

tasks.bootJar {
    archiveFileName.set("group-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}