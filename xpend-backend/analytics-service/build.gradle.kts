plugins {
    java
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

description = "Analytics and Reporting Service"

dependencies {
    // Excel/PDF generation
    implementation("org.apache.poi:poi-ooxml:5.2.4")
    implementation("com.itextpdf:itext7-core:7.2.5")
    
    // Charts and graphs
    implementation("org.jfree:jfreechart:1.5.3")
    
    // Mathematical calculations
    implementation("org.apache.commons:commons-math3:3.6.1")
    
    // Financial calculations
    implementation("org.javamoney:moneta:1.4.2")
    implementation("org.javamoney.moneta:moneta-core:1.4.2")
}

tasks.bootJar {
    archiveFileName.set("analytics-service.jar")
}

tasks.test {
    systemProperty("spring.profiles.active", "test")
}