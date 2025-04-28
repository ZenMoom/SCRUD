FROM --platform=linux/amd64 alpine:latest AS base
WORKDIR /app

COPY ./gradlew .
COPY ./gradle gradle
COPY ./build.gradle .
COPY ./settings.gradle .
COPY ./generated ./generated

FROM --platform=linux/amd64 gradle:jdk21-alpine AS example-build
WORKDIR /app
COPY --from=base /app /app

WORKDIR /app/ExampleService

COPY ./ExampleService/gradlew .
COPY ./ExampleService/build.gradle .
COPY ./ExampleService/gradle gradle

# gradlew에 실행 권한 부여
RUN chmod +x ./gradlew

# Cache dependencies
RUN ./gradlew dependencies --no-daemon || return 0

COPY ./ExampleService/src src

RUN gradle build --no-daemon -x test

# 런타임 스테이지
FROM --platform=linux/amd64 eclipse-temurin:21-jdk-alpine AS runner
WORKDIR /app/ExampleService

# 빌드 스테이지에서 생성된 JAR 파일 복사
# 일반적인 스프링 부트 프로젝트의 JAR 경로 (프로젝트에 맞게 조정 필요)
COPY --from=example-build /app/ExampleService/build/libs/*.jar scurd.jar

# 컨테이너 실행 시 사용할 포트 설정 (스프링 기본 포트: 8080)
EXPOSE 8080

# 권한 설정
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "scurd.jar"]