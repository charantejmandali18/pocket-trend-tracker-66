plugins {
    java
    id("org.springframework.boot") version "3.2.1" apply false
    id("io.spring.dependency-management") version "1.1.4" apply false
    id("org.sonarqube") version "4.4.1.3373"
}

// Configure for all projects
allprojects {
    group = "com.xpend"
    version = "1.0.0"
    
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

// Configure for all subprojects (microservices)
subprojects {
    apply(plugin = "java")
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")
    
    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
    
    configurations {
        compileOnly {
            extendsFrom(configurations.annotationProcessor.get())
        }
    }
    
    dependencies {
        // Spring Boot Starters
        implementation("org.springframework.boot:spring-boot-starter-web")
        implementation("org.springframework.boot:spring-boot-starter-data-jpa")
        implementation("org.springframework.boot:spring-boot-starter-security")
        implementation("org.springframework.boot:spring-boot-starter-validation")
        implementation("org.springframework.boot:spring-boot-starter-actuator")
        implementation("org.springframework.boot:spring-boot-starter-cache")
        implementation("org.springframework.boot:spring-boot-starter-data-redis")
        
        // Cloud & Messaging
        implementation("org.springframework.boot:spring-boot-starter-amqp")
        implementation("org.springframework.cloud:spring-cloud-starter-aws-messaging:2.2.6.RELEASE")
        
        // Database
        implementation("org.postgresql:postgresql")
        implementation("org.flywaydb:flyway-core")
        
        // JWT & Security
        implementation("io.jsonwebtoken:jjwt-api:0.12.3")
        implementation("io.jsonwebtoken:jjwt-impl:0.12.3")
        implementation("io.jsonwebtoken:jjwt-jackson:0.12.3")
        
        // Circuit Breaker & Resilience
        implementation("io.github.resilience4j:resilience4j-spring-boot3:2.1.0")
        implementation("io.github.resilience4j:resilience4j-circuitbreaker:2.1.0")
        implementation("io.github.resilience4j:resilience4j-retry:2.1.0")
        
        // Observability
        implementation("io.micrometer:micrometer-registry-prometheus")
        implementation("io.micrometer:micrometer-tracing-bridge-brave")
        implementation("net.ttddyy.observation:datasource-micrometer-spring-boot:1.0.3")
        
        // AWS SDK
        implementation("software.amazon.awssdk:s3:2.21.29")
        implementation("software.amazon.awssdk:sqs:2.21.29")
        implementation("software.amazon.awssdk:sns:2.21.29")
        implementation("software.amazon.awssdk:secretsmanager:2.21.29")
        
        // Utilities
        implementation("org.apache.commons:commons-lang3")
        implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
        implementation("org.mapstruct:mapstruct:1.5.5.Final")
        
        // Development
        // developmentOnly("org.springframework.boot:spring-boot-devtools")
        // developmentOnly("org.springframework.boot:spring-boot-docker-compose")
        
        // Annotation Processing
        annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
        annotationProcessor("org.mapstruct:mapstruct-processor:1.5.5.Final")
        annotationProcessor("org.projectlombok:lombok")
        compileOnly("org.projectlombok:lombok")
        
        // Testing
        testImplementation("org.springframework.boot:spring-boot-starter-test")
        testImplementation("org.springframework.security:spring-security-test")
        testImplementation("org.testcontainers:junit-jupiter")
        testImplementation("org.testcontainers:postgresql")
        testImplementation("org.testcontainers:redis")
    }
    
    // Dependency management handled by Spring Boot plugin
    
    tasks.withType<Test> {
        useJUnitPlatform()
        testLogging {
            events("passed", "skipped", "failed")
        }
    }
    
    tasks.withType<JavaCompile> {
        options.encoding = "UTF-8"
        options.compilerArgs.addAll(listOf("-Xlint:all", "-Xlint:-processing"))
    }
}