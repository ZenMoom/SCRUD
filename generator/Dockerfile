FROM openapitools/openapi-generator-cli:latest

WORKDIR /openapi

COPY ./generator .

COPY ./docs .

RUN mkdir -p input

RUN mkdir -p output

RUN mkdir -p backend

RUN mkdir -p frontend