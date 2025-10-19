# Multi-stage build for production optimization
FROM maven:3.9.4-eclipse-temurin-17 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies (for better caching)
COPY url-service/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY url-service/src ./src
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-jammy

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN addgroup --system app && adduser --system --group app

# Set working directory
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to app user
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]