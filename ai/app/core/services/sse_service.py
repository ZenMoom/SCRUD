import asyncio
import json
import logging
import uuid
from typing import Dict, Optional, ClassVar


class SSEService:
    """
    SSE(Server-Sent Events) 스트리밍 기능을 제공하는 서비스
    싱글톤 패턴으로 구현되어 모든 인스턴스가 동일한 sse_clients를 공유합니다.
    """
    # 싱글톤 인스턴스
    _instance: ClassVar[Optional['SSEService']] = None
    # 모든 인스턴스가 공유하는 클래스 변수
    _sse_clients: ClassVar[Dict[str, asyncio.Queue]] = {}

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(SSEService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """
        SSEService 초기화

        Args:
            logger: 로깅 객체
        """
        # 이미 초기화되었으면 다시 초기화하지 않음
        if getattr(self, '_initialized', False):
            return

        self.logger = logging.getLogger(__name__)
        self._initialized = True
        self.logger.info("SSEService 시작")

    def create_stream(self) -> tuple[str, asyncio.Queue]:
        """
        새로운 SSE 스트림을 생성합니다.

        Returns:
            tuple: (stream_id, response_queue)
        """
        stream_id = str(uuid.uuid4())
        response_queue = asyncio.Queue()
        SSEService._sse_clients[stream_id] = response_queue

        self.logger.info(f"SSE 스트림 생성: stream_id={stream_id}")
        self.logger.info(f"현재 sse clients: {SSEService._sse_clients.keys()}")

        return stream_id, response_queue

    def get_stream(self, stream_id: str) -> Optional[asyncio.Queue]:
        """
        기존 SSE 스트림을 조회합니다.

        Args:
            stream_id: 스트림 ID

        Returns:
            Optional[asyncio.Queue]: 응답 큐 또는 None (스트림이 없는 경우)
        """
        self.logger.info(f"현재 sse clients: {SSEService._sse_clients.keys()}")
        self.logger.info(f"현재 sse clients: {SSEService._sse_clients}")
        return SSEService._sse_clients.get(stream_id)

    def remove_stream(self, stream_id: str) -> None:
        """
        SSE 스트림을 제거합니다.

        Args:
            stream_id: 제거할 스트림 ID
        """
        if stream_id in SSEService._sse_clients:
            self.logger.info(f"SSE 스트림 제거: stream_id={stream_id}")
            del SSEService._sse_clients[stream_id]

    async def send_diagram_event(self, diagram_id: str, response_queue: asyncio.Queue) -> None:
        """다이어그램 생성 이벤트를 전송하는 함수"""
        event = f"data: {json.dumps({'token': {'diagramId': diagram_id}})}\n\n"
        response_queue.put_nowait(event)
        self.logger.info(f"생성 이벤트 발송: {event}")

    async def send_progress(self, response_queue: asyncio.Queue, message: str) -> None:
        """
        진행 상황 메시지를 SSE 스트림으로 전송합니다.
        
        Args:
            response_queue: 응답 큐
            message: 전송할 메시지
        """
        await response_queue.put(json.dumps({
            "type": "progress",
            "data": message
        }))

    async def send_error(self, response_queue: asyncio.Queue, error_message: str) -> None:
        """
        오류 메시지를 SSE 스트림으로 전송합니다.
        
        Args:
            response_queue: 응답 큐
            error_message: 오류 메시지
        """
        await response_queue.put(json.dumps({
            "type": "error",
            "data": error_message
        }))

    async def send_data(self, response_queue: asyncio.Queue, data: dict) -> None:
        """
        데이터를 SSE 스트림으로 전송합니다.

        Args:
            response_queue: 응답 큐
            data: 전송할 데이터
        """
        await response_queue.put(json.dumps({
            "type": "data",
            "data": data
        }))

    async def send_created(self, response_queue: asyncio.Queue, diagram_id: str) -> None:
        """
        도식화 생성 이벤트를 SSE 스트림으로 전송합니다.

        Args:
            response_queue: 응답 큐
            diagram_id: 생성된 도식화 ID
        """
        await response_queue.put(json.dumps({
            "type": "created",
            "diagramId": diagram_id
        }))

    async def close_stream(self, response_queue: asyncio.Queue) -> None:
        """
        SSE 스트림을 종료합니다.
        
        Args:
            response_queue: 종료할 응답 큐
        """
        await response_queue.put(None)
