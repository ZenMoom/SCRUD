import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 애플리케이션 설정
    APP_NAME: str = "Method Diagram AI Service"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "host.docker.internal:9092")
    print(f"연결 시도 주소: {KAFKA_BOOTSTRAP_SERVERS}")  # 디버깅용
    KAFKA_CONSUMER_GROUP: str = os.getenv("KAFKA_CONSUMER_GROUP", "diagram-ai-group")
    KAFKA_TOPIC_DIAGRAM_REQUEST: str = os.getenv("KAFKA_TOPIC_DIAGRAM_REQUEST", "diagram-requests")
    KAFKA_TOPIC_DIAGRAM_RESPONSE: str = os.getenv("KAFKA_TOPIC_DIAGRAM_RESPONSE", "diagram-responses")
    KAFKA_TOPIC_CHAT_REQUEST: str = os.getenv("KAFKA_TOPIC_CHAT_REQUEST", "chat-requests")
    KAFKA_TOPIC_CHAT_RESPONSE: str = os.getenv("KAFKA_TOPIC_CHAT_RESPONSE", "chat-responses")
    
    # MongoDB 설정
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "scrud_ai_db")

settings = Settings()