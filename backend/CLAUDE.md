# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Spring Boot backend service for the SCRUD application with the following components:

- **ExampleService**: Main Spring Boot application with REST controllers, services, and repositories
- **Generated**: OpenAPI-generated code for client interfaces
- **Common**: Shared code across services

The application follows a clean/hexagonal architecture pattern with:
- `application`: Contains DTOs, services, and facades
- `domain`: Core business logic, entities, and interfaces
- `infrastructure`: Implementation details like repositories and external services
- `presentation`: REST controllers and request/response handling

## Environment Setup

The application requires:
- Java 21
- Gradle
- MySQL database
- Docker and Docker Compose for containerized deployment

## Commands

### Build and Run

```bash
# Build the project
./gradlew clean build

# Run the application locally
./gradlew :ExampleService:bootRun

# Run with specific profile
SPRING_PROFILES_ACTIVE=dev ./gradlew :ExampleService:bootRun
```

### Docker Development Environment

```bash
# Set up the database container
./development.db.sh

# Run the full development environment (backend + dependencies)
./development.sh

# Run only the API documentation (Swagger UI)
./development.api.sh

# Generate OpenAPI client code
./codegen.sh
```

### Testing

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests com.barcoder.scrud.apispec.application.facade.ApiCreateFacadeTest

# Run with test coverage report
./gradlew test jacocoTestReport
```

## Key Configuration

- **Database**: MySQL configuration in `application.yaml`
- **Security**: OAuth2 for Google and GitHub authentication
- **Environment Variables**: Loaded from `.env.development.local` files in `infra/env/`
- **API Documentation**: Swagger/OpenAPI available at `/swagger-ui.html`

## Architecture Notes

1. **API Specifications**:
   - The system manages API specifications (`ApiSpecVersion`) with versioning
   - Supports different HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Uses facades to coordinate between services

2. **Projects**:
   - SCRUD projects are the main organizational unit
   - Global files can be associated with projects

3. **Security**:
   - JWT-based authentication
   - OAuth2 support for GitHub and Google
   - Role-based access control

4. **External Services**:
   - WebClient is used for external API calls
   - Event-driven communication between services

## Testing Approach

- JUnit 5 with Spring Boot Test
- Integration tests use `@SpringBootTest`
- Transaction management with `@Transactional` and `@Rollback`
- H2 in-memory database for testing

## Server-Sent Events (SSE)

The application includes SSE support for real-time event streaming from server to client.

### Using SSE in the Backend

1. **Obtain a Stream ID**:
   - Client requests a stream ID from `/api/v1/projects/{projectId}/apis/{apiId}/chats`
   - Backend returns a `SSEIdResponse` with the `streamId`

2. **Connect to the SSE Stream**:
   - Client connects to `/api/sse/connect/{streamId}` to establish SSE connection
   - The server maintains this connection for events

3. **Send Events via SseEmitterService**:
   ```java
   // Inject the service
   @Autowired
   private SseEmitterService sseEmitterService;

   // Send an event to a specific stream
   sseEmitterService.sendEvent(streamId, "eventName", eventData);
   ```

4. **Testing SSE Connections**:
   - Use `/api/sse/test/generate-id` to create a test stream ID
   - Send test events with `/api/sse/test/sequence/{streamId}` or `/api/sse/test/chat/{streamId}`
   - Check connection status with `/api/sse/status/{streamId}`