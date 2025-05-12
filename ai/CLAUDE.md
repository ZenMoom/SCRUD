# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI service built with FastAPI that processes OpenAPI specifications to generate class diagrams. It uses large language models (LLM) to analyze API specifications and create visual representations of the system architecture. The service communicates with other system components via Kafka for message passing and MongoDB for data persistence.

## Architecture

- **FastAPI Application**: Provides HTTP endpoints for chat-based interaction
- **LLM Integration**: Uses LangChain to connect to different LLM providers (OpenAI, Anthropic, Ollama)
- **Message Queue**: Kafka for asynchronous communication with other services
- **Database**: MongoDB for storing diagram data and chat history
- **Streaming**: Server-Sent Events (SSE) for streaming LLM responses to clients

## Core Components

1. **Core Services**: Business logic for processing API specs and generating diagrams
   - `ChatService`: Processes OpenAPI specs using LLMs to generate diagram data

2. **Infrastructure**: External service integrations
   - `KafkaConsumer/Producer`: Message queue integration
   - `MongoRepository`: Database access layer with repository pattern

3. **API Layer**: FastAPI routes for HTTP endpoints
   - `chat_routes.py`: Endpoints for chat-based interaction

4. **Model Generation**: LLM provider integrations
   - `ModelGenerator`: Factory for creating LLM instances (OpenAI, Anthropic, Ollama)
   - `SSEStreamingHandler`: Callbacks for streaming LLM responses

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
- `MONGO_URI`: MongoDB connection URI
- `MONGO_DB_NAME`: MongoDB database name

## Testing Approach

The project uses pytest for unit and integration testing:
- `test_chat_service.py`: Unit tests with mocks
- `test_chat_service_real.py`: Integration tests with real LLM API calls (marked with `-m real`)

## Common Patterns

1. **Repository Pattern**: Database access is abstracted through repositories
   - `MongoRepository`: Interface for MongoDB operations
   - `MongoRepositoryImpl`: Implementation with MongoDB

2. **Dependency Injection**: Services take dependencies as constructor parameters

3. **Event Streaming**: Using SSE for streaming LLM responses
   - `SSEStreamingHandler` processes streaming tokens

4. **Kafka Message Handling**: Request/response handling through Kafka
   - Handler registration in `main.py`
   - Message processing in `handlers.py`