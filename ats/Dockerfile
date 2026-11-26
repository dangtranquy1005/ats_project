FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src/main ./src/main
RUN --mount=type=cache,target=/root/.m2 mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid 10001 --system --create-home app && chown app:app /app
COPY --from=build --chown=app:app /build/target/*.jar /app/app.jar
USER app
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
