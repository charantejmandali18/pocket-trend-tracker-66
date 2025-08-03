FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY file-service file-service

# Build the specific service
RUN ./gradlew :file-service:bootJar --no-daemon

# Run the application
EXPOSE 8088
CMD ["java", "-jar", "file-service/build/libs/file-service.jar"]
