FROM openjdk:21-jdk-slim

WORKDIR /app

COPY extraction-service/build/libs/extraction-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8089

ENTRYPOINT ["java", "-jar", "app.jar"]