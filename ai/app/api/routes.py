import logging
from fastapi import APIRouter, HTTPException

from app.infrastructure.kafka.consumer import kafka_consumer
from app.infrastructure.kafka.dto.user_chat_dto import UserChatRequest
from app.infrastructure.kafka.producer import kafka_producer
from app.config.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/diagrams/request")
async def create_diagram_request(request: UserChatRequest):
    """
    스프링에서 오는 요청이라고 가정하는 API
    1. Request 토픽에 사용자 채팅 정보 메시지를 보낸다.
    """

    logger.info(f"create_diagram_request: {request}")

    try:
        # Kafka로 메시지 전송
        await kafka_producer.producer.send_and_wait(
            topic=settings.KAFKA_TOPIC_CHAT_REQUEST,
            value=request.model_dump_json().encode("utf-8"),
            key=f"{request.tag}".encode("utf-8")
        )
        logger.info(f"Sent diagram request for project {request}")
        return {"status": "request_sent", "message": "다이어그램 요청이 성공적으로 전송되었습니다"}

    except Exception as e:
        logger.error(f"Error sending diagram request: {e}")
        raise HTTPException(status_code=500, detail=f"메시지 전송 중 오류 발생: {str(e)}")


@router.get("/status")
async def get_status():
    """서비스 상태 확인"""
    return {
        "status": "running",
        "kafka_producer": "running" if kafka_producer.producer else "stopped",
        "kafka_consumer": "running" if kafka_consumer.running else "stopped",
    }