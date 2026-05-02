# Multi-stage Dockerfile for Java microservices
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy pom and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:resolve dependency:resolve-plugins

# Copy source and build
COPY src src
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 spring && adduser -D -u 1000 -G spring spring

# Copy JAR from builder
COPY --from=builder --chown=spring:spring /build/target/*.jar app.jar

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-XX:+EnableDynamicAgentLoading", "-jar", "app.jar"]
