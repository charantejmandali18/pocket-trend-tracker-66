FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy only the required service directory
COPY budget-service budget-service

# Build the specific service
RUN ./gradlew :budget-service:bootJar --no-daemon

# Run the application
EXPOSE 8085
CMD ["java", "-jar", "budget-service/build/libs/budget-service.jar"]
