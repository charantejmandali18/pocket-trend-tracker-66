FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY account-service account-service

# Build the specific service
RUN ./gradlew :account-service:bootJar --no-daemon

# Run the application
EXPOSE 8083
CMD ["java", "-jar", "account-service/build/libs/account-service.jar"]
