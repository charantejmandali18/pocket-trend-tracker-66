FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY group-service group-service

# Build the specific service
RUN ./gradlew :group-service:bootJar --no-daemon

# Run the application
EXPOSE 8086
CMD ["java", "-jar", "group-service/build/libs/group-service.jar"]
