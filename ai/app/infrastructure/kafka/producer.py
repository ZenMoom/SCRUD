import logging

import aiokafka # type: ignore

from app.config.config import settings
from app.infrastructure.kafka.dto.system_chat_dto import SystemChatResponse
from app.infrastructure.kafka.dto.user_chat_dto import UserChatRequest

logger = logging.getLogger(__name__)

class KafkaProducer:
    def __init__(self):
        self.producer = None

    async def start(self):
        self.producer = aiokafka.AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS
        )
        await self.producer.start()
        logger.info("Kafka producer started")

    async def stop(self):
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped")

    async def send_diagram_response(self, payload: UserChatRequest):
        if not self.producer:
            logger.error("Kafka producer not started")
            return

        await self.producer.send_and_wait(
            topic=settings.KAFKA_TOPIC_DIAGRAM_RESPONSE,
            key=f"{payload.tag}".encode("utf-8"),
            value=payload
        )
        logger.info(f"Sent diagram response for project {payload.tag}")

    async def send_chat_response(self, payload: SystemChatResponse):
        if not self.producer:
            logger.error("Kafka producer not started")
            return

        await self.producer.send_and_wait(
            topic=settings.KAFKA_TOPIC_CHAT_RESPONSE,
            value=payload.model_dump_json().encode("utf-8"),
            key=f"{payload.diagramId}".encode("utf-8"),
        )

kafka_producer = KafkaProducer()