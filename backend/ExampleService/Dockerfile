FROM alpine:latest AS base
WORKDIR /app

COPY ./gradlew .
COPY ./gradle gradle
COPY ./build.gradle .
COPY ./settings.gradle .
COPY ./generated ./generated

FROM gradle:jdk21-alpine AS project-build
WORKDIR /app
COPY --from=base /app /app

WORKDIR /app/project-module

COPY ./project-module/gradlew .
COPY ./project-module/build.gradle .
COPY ./project-module/gradle gradle

# gradlew에 실행 권한 부여
RUN chmod +x ./gradlew

# Cache dependencies
RUN ./gradlew dependencies --no-daemon || return 0

COPY ./project-module/src src

RUN gradle build --no-daemon -x test

# 런타임 스테이지
FROM eclipse-temurin:21-jdk-alpine AS development
WORKDIR /app/project-module

# 빌드 스테이지에서 생성된 JAR 파일 복사
# 일반적인 스프링 부트 프로젝트의 JAR 경로 (프로젝트에 맞게 조정 필요)
COPY --from=project-build /app/project-module/build/libs/*.jar scurd.jar

# 컨테이너 실행 시 사용할 포트 설정 (스프링 기본 포트: 8080)
EXPOSE 8080

# 권한 설정
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "scurd.jar"]