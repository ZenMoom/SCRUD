import asyncio
import json
import logging
import uuid
from typing import Dict

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks

from app.api.dto.diagram_dto import UserChatRequest
from app.core.generator.model_generator import ModelGenerator
from app.core.services.chat_service import ChatService

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                  format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

chat_router = APIRouter()

from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository

def get_diagram_repository() -> DiagramRepository:
    from app.infrastructure.mongodb.repository.diagram_repository_impl import DiagramRepositoryImpl
    return DiagramRepositoryImpl()


from app.infrastructure.mongodb.repository.chat_repository import ChatRepository

def get_chat_repository() -> ChatRepository:
    from app.infrastructure.mongodb.repository.chat_repository_impl import ChatRepositoryImpl
    return ChatRepositoryImpl()

def get_chat_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository),
        chat_repository: ChatRepository = Depends(get_chat_repository)
) -> ChatService:
    model_generator = ModelGenerator()
    return ChatService(
        model_name="openai",
        model_generator=model_generator,
        diagram_repository=diagram_repository,
        chat_repository=chat_repository,
        logger=logger,
    )

# SSE 스트리밍을 위한 클라이언트 매핑
sse_clients = {}

#####################################################################################################
###############################         Controller        ###########################################
#####################################################################################################

@chat_router.post("/projects/{project_id}/apis/{api_id}/chats")
async def prompt_chat(
    project_id: str,
    api_id: str,
    user_chat_data: UserChatRequest,
    background_tasks: BackgroundTasks,
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    프롬프트를 입력하여 도식화 수정을 요청하거나 설명을 요청합니다.
    응답 값으로 SSE Id를 받아 /api/sse/connect/{SSE_Id} API에 연결하여 응답을 스트리밍 받을 수 있습니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        user_chat_data: 사용자 채팅 데이터
        background_tasks: BackgroundTasks
        chat_service: ChatService

    Returns:
        Dict[str, str]: SSE 연결을 위한 스트림 ID
    """
    logger.info(f"프롬프트 채팅 요청 시작: project_id={project_id}, api_id={api_id}")
    logger.debug(f"사용자 채팅 데이터: {user_chat_data}")

    try:
        # SSE 스트리밍을 위한 응답 큐 생성
        stream_id = str(uuid.uuid4())
        response_queue = asyncio.Queue()
        sse_clients[stream_id] = response_queue

        logger.info(f"SSE 스트림 생성: stream_id={stream_id}")

        # 채팅 및 다이어그램 처리를 백그라운드 태스크로 실행
        background_tasks.add_task(
            process_chat_and_diagram,
            project_id,
            api_id,
            user_chat_data,
            chat_service,
            response_queue
        )

        logger.info(f"백그라운드 태스크 등록 완료: stream_id={stream_id}")

        # 스트림 ID 반환
        return {"streamId": stream_id}
    except Exception as e:
        logger.error(f"채팅 처리 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@chat_router.get("/sse/connect/{sse_id}")
async def connect_sse(sse_id: str):
    """
    SSE 연결을 설정하여 실시간 응답을 스트리밍 받습니다.

    Args:
        sse_id: SSE 연결 ID

    Returns:
        StreamingResponse: 스트리밍 응답 객체
    """
    from fastapi.responses import StreamingResponse

    logger.info(f"SSE 연결 요청: sse_id={sse_id}")

    if sse_id not in sse_clients:
        logger.warning(f"유효하지 않은 스트림 ID: {sse_id}")
        raise HTTPException(status_code=404, detail="유효하지 않은 스트림 ID입니다.")

    logger.info(f"유효한 스트림 ID 확인: sse_id={sse_id}")
    response_queue = sse_clients[sse_id]

    async def event_generator():
        try:
            logger.info(f"SSE 이벤트 생성기 시작: sse_id={sse_id}")

            while True:
                # 큐에서 데이터 대기
                data = await response_queue.get()

                # 종료 신호 확인
                if data is None:
                    logger.info(f"SSE 스트림 종료: sse_id={sse_id}")
                    break

                logger.debug(f"SSE 데이터 전송: {data[:100]}...")

                # SSE 형식으로 데이터 전송
                yield f"data: {data}\n\n"

        except Exception as e:
            logger.error(f"SSE 스트리밍 중 오류 발생: {str(e)}", exc_info=True)
        finally:
            # 클라이언트 연결 종료 시 정리
            logger.info(f"SSE 연결 정리: sse_id={sse_id}")
            if sse_id in sse_clients:
                del sse_clients[sse_id]

    logger.info(f"SSE 스트리밍 응답 시작: sse_id={sse_id}")
    return StreamingResponse(event_generator(), media_type="text/event-stream")

async def process_chat_and_diagram(
    project_id: str,
    api_id: str,
    user_chat_data: UserChatRequest,
    chat_service: ChatService,
    response_queue: asyncio.Queue
):
    """
    채팅 요청을 처리하고 필요한 경우 다이어그램을 업데이트하는 백그라운드 태스크

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        user_chat_data: 사용자 채팅 데이터
        chat_service: 채팅 서비스
        response_queue: 응답 데이터를 전송할 큐
    """
    logger.info(f"채팅 및 다이어그램 처리 백그라운드 태스크 시작: project_id={project_id}, api_id={api_id}")

    try:

        # 최신 다이어그램 조회 (가장 높은 버전)
        # 버전에 대한 정보가 없으므로 임시로 최신 다이어그램을 가져옴
        all_diagrams = await diagram_repository.find_many({
            "projectId": project_id,
            "apiId": api_id
        }, sort=[("metadata.version", -1)])

        latest_diagram = all_diagrams[0] if all_diagrams else None

        if latest_diagram:
            logger.info(f"최신 다이어그램 조회: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")
        else:
            logger.info("기존 다이어그램이 없음. 첫 다이어그램 생성 필요")
            # 사용자 채팅에 따라 다이어그램 생성 또는 수정

            logger.info("다이어그램 생성/수정 처리 중")

            # 실제 다이어그램 생성 로직 실행
            await chat_service.create_diagram_from_openapi(
                user_chat_data,
                response_queue,
                project_id=project_id,
                api_id=api_id
            )

        # 스트리밍 종료
        await response_queue.put(None)
        logger.info("SSE 스트림 종료")

    except Exception as e:
        logger.error(f"채팅 및 다이어그램 처리 중 오류 발생: {str(e)}", exc_info=True)
        # 오류 응답 전송
        error_response = {
            "type": "error",
            "data": f"처리 중 오류가 발생했습니다: {str(e)}"
        }
        await response_queue.put(json.dumps(error_response))
        await response_queue.put(None)