import json
import logging
import asyncio
import aiokafka # type: ignore
from typing import Callable
from app.config.config import settings
from app.infrastructure.kafka.dto.diagram_dto import DiagramRequest
from app.infrastructure.kafka.util.deserializer import pydantic_deserializer

logger = logging.getLogger(__name__)

class KafkaConsumer:
    def __init__(self):
        self.consumers = {}
        self.running = False
        self.handlers = {}

    def register_handler(self, topic: str, handler: Callable):
        self.handlers[topic] = handler
        logger.info(f"Registered handler for topic {topic}")

    async def start(self):
        self.running = True

        # 다이어그램 요청 컨슈머
        diagram_consumer = aiokafka.AIOKafkaConsumer(
            settings.KAFKA_TOPIC_DIAGRAM_REQUEST,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id=f"{settings.KAFKA_CONSUMER_GROUP}-diagram",
            value_deserializer = pydantic_deserializer(DiagramRequest)
        )

        # 채팅 요청 컨슈머
        from app.infrastructure.kafka.dto.user_chat_dto import UserChatRequest
        chat_consumer = aiokafka.AIOKafkaConsumer(
            settings.KAFKA_TOPIC_CHAT_REQUEST,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id=f"{settings.KAFKA_CONSUMER_GROUP}-chat",
            value_deserializer=pydantic_deserializer(UserChatRequest)
        )

        self.consumers = {
            settings.KAFKA_TOPIC_DIAGRAM_REQUEST: diagram_consumer,
            settings.KAFKA_TOPIC_CHAT_REQUEST: chat_consumer
        }

        # 모든 컨슈머 시작
        for topic, consumer in self.consumers.items():
            await consumer.start()
            logger.info(f"Started consumer for topic {topic}")

            # 각 컨슈머에 대한 처리 태스크 생성
            asyncio.create_task(self._consume_messages(topic, consumer))

    async def _consume_messages(self, topic: str, consumer: aiokafka.AIOKafkaConsumer):
        """
        Kafka 토픽에서 메시지를 소비하는 메인 함수.

        Args:
            topic: 소비할 Kafka 토픽 이름
            consumer: Kafka 컨슈머 인스턴스

        작동 방식:
        1. 메시지 처리 함수를 호출하고 예외 발생 시 처리
        2. 오류 발생 시 5초 후 재시작 시도
        """
        try:
            # 메인 메시지 처리 루프 호출
            await self._process_consumer_messages(topic, consumer)
        except Exception as e:
            # 컨슈머 전체 오류 발생 시 로깅
            logger.error(f"Consumer error: {e}")
            if self.running:
                # 서비스가 아직 실행 중이면 5초 후 재시작 시도
                await asyncio.sleep(5)
                asyncio.create_task(self._consume_messages(topic, consumer))

    async def _process_consumer_messages(self, topic: str, consumer: aiokafka.AIOKafkaConsumer):
        """
        컨슈머로부터 메시지를 반복적으로 읽어 처리하는 함수.

        Args:
            topic: 소비할 Kafka 토픽 이름
            consumer: Kafka 컨슈머 인스턴스

        작동 방식:
        1. 컨슈머로부터 메시지를 비동기적으로 반복 수신
        2. 서비스 중단 요청 시 루프 종료
        3. 각 메시지에 대해 처리 함수 호출
        """
        # 컨슈머에서 메시지 스트림 반복 처리
        async for message in consumer:
            # 서비스가 중단되었다면 메시지 소비 중단
            if not self.running:
                break

            # 개별 메시지 처리 - 실패 시 다음 메시지로 진행
            if not await self._handle_message(topic, message):
                continue

    async def _handle_message(self, topic: str, message) -> bool:
        """
        단일 Kafka 메시지를 처리하는 함수.

        Args:
            topic: 메시지가 수신된 토픽 이름
            message: 처리할 Kafka 메시지 객체

        Returns:
            bool: 메시지 처리 성공 여부

        작동 방식:
        1. 메시지를 JSON으로 디코딩
        2. 해당 토픽에 등록된 핸들러 함수 호출
        3. 예외 발생 시 로깅하고 실패 반환
        """
        try:
            # 바이너리 메시지를 UTF-8로 디코딩 후 JSON 파싱
            value = message.value
            # 토픽에 등록된 핸들러 함수 찾기
            handler = self.handlers.get(topic)

            # 핸들러가 없으면 경고 로깅 후 실패 반환
            if not handler:
                logger.warning(f"No handler registered for topic {topic}")
                return False

            # 핸들러 함수 호출하여 메시지 처리
            await handler(value)
            # 성공적으로 처리됨
            return True

        except json.JSONDecodeError:
            # JSON 파싱 오류 발생 시 로깅
            logger.error(f"Failed to decode message: {message.value}")
        except Exception as e:
            # 그 외 모든 예외 처리 및 로깅
            logger.error(f"Error processing message: {e}")

        # 어떤 예외가 발생했다면 실패 반환
        return False

    async def stop(self):
        self.running = False
        for consumer in self.consumers.values():
            await consumer.stop()
        logger.info("Kafka consumers stopped")

kafka_consumer = KafkaConsumer()