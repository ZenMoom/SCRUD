# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI service built with FastAPI that processes OpenAPI specifications to generate class diagrams. It uses large language models (LLM) to analyze API specifications and create visual representations of the system architecture. The service communicates with other system components via HTTP requests and MongoDB for data persistence.

## Architecture

- **FastAPI Application**: Provides HTTP endpoints for chat-based interaction and diagram generation
- **LLM Integration**: Uses LangChain to connect to different LLM providers (OpenAI, Anthropic, Ollama)
- **Database**: MongoDB for storing diagram data and chat history
- **Streaming**: Server-Sent Events (SSE) for streaming LLM responses to clients
- **RAG Implementation**: Retrieval-Augmented Generation for more accurate diagram generation based on context

## Core Components

1. **Core Services**: Business logic for processing API specs and generating diagrams
   - `ChatService`: Processes OpenAPI specs using LLMs to generate diagram data
   - `DiagramService`: Manages diagram creation, retrieval, and component positioning
   - `SSEService`: Singleton for managing streaming connections to clients

2. **Infrastructure**: External service integrations
   - `MongoRepository`: Database access layer with generic repository pattern
   - `ApiClient`: HTTP client for external API communication

3. **API Layer**: FastAPI routes for HTTP endpoints
   - `api_routes.py`: API spec generation endpoints
   - `chat_routes.py`: Chat interaction and SSE connection endpoints
   - `diagram_routes.py`: Diagram CRUD and component positioning endpoints

4. **Model Generation**: LLM provider integrations
   - `ModelGenerator`: Factory for creating LLM instances (OpenAI, Anthropic, Ollama)
   - `ApiModelGenerator`: Specialized generator for API specification analysis
   - `StreamingHandler`: Callbacks for streaming LLM responses
   - `DiagramCreateGenerator`: Specialized generator for creating diagrams with LLM

5. **RAG Implementation**: 
   - `CreateDiagramComponentRAG`: Uses vector storage and embeddings to enhance diagram generation with relevant context

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
pytest tests/unit/test_convert_diagram.py

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
- `OPENAI_API_BASE`: Base URL for OpenAI API
- `ANTHROPIC_API_KEY`: Anthropic API key
- `OLLAMA_API_URL`: URL for Ollama API
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

4. **Factory Pattern**: For LLM provider creation
   - `ModelGenerator` creates appropriate LLM instance based on configuration
   - Supports OpenAI, Anthropic, and Ollama

5. **Async/Await**: Used consistently throughout the codebase
   - Non-blocking I/O for database and external service operations
   - Async context managers for resource lifecycle management

6. **RAG Pattern**: For enhancing LLM responses with relevant context
   - Embeddings and vector stores to retrieve similar content
   - Context-enhanced prompts for more accurate diagram generation

7. **Pydantic Models**: For type validation and data transformation
   - Strongly typed data models with validation
   - Input/output DTOs with conversion methods

## Recent Developments

The repository is actively implementing Retrieval-Augmented Generation (RAG) capabilities to improve diagram generation accuracy by providing relevant context from previous diagrams and specifications. The implementation is in `create_diagram_component_rag.py` which enhances the diagram creation process.