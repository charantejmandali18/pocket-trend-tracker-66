FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY analytics-service analytics-service

# Build the specific service
RUN ./gradlew :analytics-service:bootJar --no-daemon

# Run the application
EXPOSE 8087
CMD ["java", "-jar", "analytics-service/build/libs/analytics-service.jar"]
