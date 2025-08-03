FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY transaction-service transaction-service

# Build the specific service
RUN ./gradlew :transaction-service:bootJar --no-daemon

# Run the application
EXPOSE 8082
CMD ["java", "-jar", "transaction-service/build/libs/transaction-service.jar"]
