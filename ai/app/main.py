import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.config import settings
from app.infrastructure.kafka.consumer import kafka_consumer
from app.infrastructure.kafka.producer import kafka_producer
from app.infrastructure.kafka.handler.handlers import handle_user_chat_request
from app.api.routes import router
from app.api.chat_routes import chat_router

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 실행
    await kafka_producer.start()
    logger.info("Kafka producer started")

    kafka_consumer.register_handler(
        settings.KAFKA_TOPIC_CHAT_REQUEST,
        handle_user_chat_request
    )
    await kafka_consumer.start()
    logger.info("Kafka consumer started")

    yield

    # 종료 시 실행
    await kafka_producer.stop()
    await kafka_consumer.stop()
    logger.info("Kafka clients stopped")

# FastAPI 앱 생성에 lifespan 추가
app = FastAPI(title="FastAPI Kafka Tutorial", lifespan=lifespan)
# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 출처 허용 (개발 환경), 프로덕션에서는 특정 도메인만 설정
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)
# 라우터 포함
app.include_router(router)
app.include_router(chat_router, prefix="/api/v1")
# 직접 실행 시 서버 시작
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)