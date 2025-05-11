import asyncio
import uuid
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

from app.core.services.chat_service import ChatService
from app.core.generator.model_generator import ModelGenerator
from app.infrastructure.mongodb.repository.mongo_mock_repository import MongoMockRepository

chat_router = APIRouter()

# 스트림 세션 저장소
stream_sessions = {}
chat_service = ChatService(
    model_name="ollama",
    model_generator=ModelGenerator(),
    repository=MongoMockRepository(),
)

@chat_router.post("/chat/start")
async def start_chat(request: Request):
    """채팅 시작 - 스트림 ID 생성 및 메시지 처리 시작"""
    print(f"[디버깅] /chat/start 엔드포인트 호출됨")
    data = await request.json()
    user_message = data.get("message", "")
    print(f"[디버깅] 사용자 메시지 수신: '{user_message}'")

    # 새 스트림 ID 생성
    stream_id = str(uuid.uuid4())
    print(f"[디버깅] 새 스트림 ID 생성: {stream_id}")

    # 응답 큐 생성
    response_queue = asyncio.Queue()
    stream_sessions[stream_id] = response_queue
    print(f"[디버깅] 스트림 세션에 응답 큐 저장: {stream_id}")

    # 비동기 LLM 처리 시작
    print(f"[디버깅] LLM 처리 태스크 생성 중")
    asyncio.create_task(chat_service.create_diagram_from_openapi(user_message, response_queue))
    print(f"[디버깅] LLM 처리 태스크 생성 완료")

    # 스트림 ID 반환
    print(f"[디버깅] 스트림 ID 반환: {stream_id}")
    return JSONResponse({"stream_id": stream_id})


@chat_router.get("/chat/stream/{stream_id}")
async def stream_chat(stream_id: str):
    """SSE 스트리밍 - GET 메서드로 접근 가능"""
    print(f"[디버깅] /chat/stream/{stream_id} 엔드포인트 호출됨")
    if stream_id not in stream_sessions:
        print(f"[디버깅] 유효하지 않은 스트림 ID: {stream_id}")
        return JSONResponse(
            {"error": "Invalid or expired stream ID"},
            status_code=404
        )

    response_queue = stream_sessions[stream_id]
    print(f"[디버깅] 스트림 응답 큐 검색 완료: {stream_id}")

    async def event_generator():
        try:
            while True:
                event = await response_queue.get()
                print(f"[디버깅] 클라이언트로 이벤트 전송: {event[:30]}...")
                yield event
                if "done" in event:
                    print(f"[디버깅] 스트림 종료 이벤트 감지: {stream_id}")
                    break
        finally:
            if stream_id in stream_sessions:
                print(f"[디버깅] 스트림 세션 정리 중: {stream_id}")
                del stream_sessions[stream_id]
                print(f"[디버깅] 스트림 세션 삭제 완료: {stream_id}")
            print(f"[디버깅] event_generator 종료: {stream_id}")

    print(f"[디버깅] 스트리밍 응답 반환 중")
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )