# Dockerfile for AI service

# Base stage with common dependencies
FROM python:3.12-slim AS base

WORKDIR /app

# Install pip dependencies
RUN pip install --no-cache-dir --upgrade pip

# Development stage with all dependencies
FROM base AS development

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code after installing dependencies to leverage caching
COPY ./app ./app
COPY ./resources ./resources
COPY ./tests ./tests

# Expose port for FastAPI
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Build stage for production optimizations
FROM base AS build

# Copy and install requirements separately for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage with minimal dependencies
FROM python:3.12-slim AS production

WORKDIR /app

# Copy dependencies from build stage
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

# Copy only necessary application code
COPY ./app ./app
COPY ./resources ./resources

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port for FastAPI
EXPOSE 8000

# Run the application with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]