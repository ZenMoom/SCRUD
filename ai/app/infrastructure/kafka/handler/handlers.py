import logging
from app.infrastructure.kafka.dto.user_chat_dto import UserChatRequest
from app.infrastructure.kafka.dto.system_chat_dto import SystemChatResponse
from app.infrastructure.kafka.producer import kafka_producer
from app.core.services.diagram_service import create_diagram

logger = logging.getLogger(__name__)


async def handle_user_chat_request(message: UserChatRequest):
    """
    다이어그램 응답 처리 핸들러
    - KAFKA_TOPIC_DIAGRAM_RESPONSE를 listen하고 있는 producer로 메시지를 보낸다.
    """
    logger.info("다이어그램 응답 처리 핸들러 handle_user_chat_request")

    try:
        logger.info(f"Received diagram request: {message}")
        system_chat_response: SystemChatResponse = await create_diagram(message)
        await kafka_producer.send_chat_response(system_chat_response)

    except Exception as e:
        logger.error(f"Error handling user chat request: {e}")