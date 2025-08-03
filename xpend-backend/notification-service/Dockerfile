FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY notification-service notification-service

# Build the specific service
RUN ./gradlew :notification-service:bootJar --no-daemon

# Run the application
EXPOSE 8089
CMD ["java", "-jar", "notification-service/build/libs/notification-service.jar"]
