FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY customer-service customer-service

# Build the specific service
RUN ./gradlew :customer-service:bootJar --no-daemon

# Run the application
EXPOSE 8081
CMD ["java", "-jar", "customer-service/build/libs/customer-service.jar"]