FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY category-service category-service

# Build the specific service
RUN ./gradlew :category-service:bootJar --no-daemon

# Run the application
EXPOSE 8084
CMD ["java", "-jar", "category-service/build/libs/category-service.jar"]
