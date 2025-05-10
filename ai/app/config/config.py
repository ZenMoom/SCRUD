import os
from dotenv import load_dotenv

env_url = os.path.join("..", "..", "infra", "env", ".env.development.local")
load_dotenv(env_url)

class Settings:
    # 애플리케이션 설정
    APP_NAME: str = "Method Diagram AI Service"
    AI_ENV_MODE: str = os.getenv("AI_ENV_MODE", "None")
    print(f"현재 환경: {AI_ENV_MODE}")  # 디버깅용

    # LLM API 키 설정
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OLLAMA_API_URL: str = os.getenv("OLLAMA_API_URL", "")

    # 메시지 큐 설정
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "host.docker.internal:9092")
    KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "diagram-ai-group")
    KAFKA_TOPIC_DIAGRAM_REQUEST: str = os.getenv("KAFKA_TOPIC_DIAGRAM_REQUEST", "diagram-requests")
    KAFKA_TOPIC_DIAGRAM_RESPONSE: str = os.getenv("KAFKA_TOPIC_DIAGRAM_RESPONSE", "diagram-responses")
    KAFKA_TOPIC_CHAT_REQUEST: str = os.getenv("KAFKA_TOPIC_CHAT_REQUEST", "chat-requests")
    KAFKA_TOPIC_CHAT_RESPONSE: str = os.getenv("KAFKA_TOPIC_CHAT_RESPONSE", "chat-responses")
    
    # MongoDB 설정
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "scrud_ai_db")

settings = Settings()