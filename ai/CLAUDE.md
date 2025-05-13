# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI service built with FastAPI that processes OpenAPI specifications to generate class diagrams. It uses large language models (LLM) to analyze API specifications and create visual representations of the system architecture. The service communicates with other system components via Kafka for message passing and MongoDB for data persistence.

## Architecture

- **FastAPI Application**: Provides HTTP endpoints for chat-based interaction and diagram generation
- **LLM Integration**: Uses LangChain to connect to different LLM providers (OpenAI, Anthropic, Ollama)
- **Message Queue**: Kafka for asynchronous communication with other services
- **Database**: MongoDB for storing diagram data and chat history
- **Streaming**: Server-Sent Events (SSE) for streaming LLM responses to clients

## Core Components

1. **Core Services**: Business logic for processing API specs and generating diagrams
   - `ChatService`: Processes OpenAPI specs using LLMs to generate diagram data
   - `DiagramService`: Manages diagram creation, retrieval, and component positioning
   - `SSEService`: Singleton for managing streaming connections to clients

2. **Infrastructure**: External service integrations
   - `KafkaConsumer/Producer`: Asynchronous message queue integration with handler registration
   - `MongoRepository`: Database access layer with generic repository pattern

3. **API Layer**: FastAPI routes for HTTP endpoints
   - `api_routes.py`: API spec generation endpoints
   - `chat_routes.py`: Chat interaction and SSE connection endpoints
   - `diagram_routes.py`: Diagram CRUD and component positioning endpoints

4. **Model Generation**: LLM provider integrations
   - `ModelGenerator`: Factory for creating LLM instances (OpenAI, Anthropic, Ollama)
   - `ApiModelGenerator`: Specialized generator for API specification analysis
   - `StreamingHandler`: Callbacks for streaming LLM responses

## Development Commands

### Setup and Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server in development mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running with Docker

```bash
# Build and run the development container
docker build -t ai-service:dev -f Dockerfile --target development .
docker run -p 8000:8000 ai-service:dev

# Build and run the production container
docker build -t ai-service:prod -f Dockerfile --target production .
docker run -p 8000:8000 ai-service:prod
```

### Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_chat_service.py

# Run tests with specific marker (e.g., real tests that call actual APIs)
pytest -m real

# Run tests with coverage report
pytest --cov=app tests/

# Test API endpoints manually with HTTP files
# Use REST Client extension in VS Code to run:
tests/http/chat_route.http
tests/http/diagram_route.http
```

## Environment Variables

The application uses environment variables for configuration. The main configuration is loaded from:
- `Settings` class in `app/config/config.py`
- Loaded from `.env.development.local` file (located in infra/env)

Key environment variables:
- `AI_ENV_MODE`: Environment mode
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `OLLAMA_API_URL`: URL for Ollama API
- `KAFKA_BOOTSTRAP_SERVERS`: Kafka server addresses
- `KAFKA_TOPIC_*`: Topic names for various Kafka message types
- `MONGO_URI`: MongoDB connection URI
- `MONGO_DB_NAME`: MongoDB database name

## Testing Approach

The project uses pytest for unit and integration testing:
- Mock-based unit tests with pytest-mock
- Async testing with pytest-asyncio
- Integration tests with real LLM API calls (marked with `-m real`)
- HTTP request files for API endpoint testing
- Test coverage reporting with pytest-cov

## Common Patterns

1. **Repository Pattern**: Database access is abstracted through repositories
   - Generic repository with type variables for type safety
   - Specialized repositories for specific domain entities (chat, diagram)

2. **Dependency Injection**: Services take dependencies as constructor parameters
   - Makes testing easier with mock repositories and services

3. **Event Streaming**: Using SSE for streaming LLM responses
   - `SSEService` singleton manages client connections
   - `StreamingHandler` processes streaming tokens

4. **Kafka Message Handling**: Asynchronous request/response handling
   - Handler registration in `main.py`
   - Message correlation using keys
   - Strong typing with DTOs

5. **Factory Pattern**: For LLM provider creation
   - `ModelGenerator` creates appropriate LLM instance based on configuration
   - Supports OpenAI, Anthropic, and Ollama

6. **Async/Await**: Used consistently throughout the codebase
   - Non-blocking I/O for database and message broker operations
   - Async context managers for resource lifecycle management