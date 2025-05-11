import logging

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse

from app.api.dto.diagram_dto import UserChatRequest
from app.core.generator.model_generator import ModelGenerator
from app.core.services.chat_service import ChatService
from app.core.services.sse_service import SSEService

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                  format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 라우터 생성
chat_router = APIRouter()

# 의존성 주입을 위한 함수
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository


def get_diagram_repository() -> DiagramRepository:
    from app.infrastructure.mongodb.repository.diagram_repository_impl import DiagramRepositoryImpl
    return DiagramRepositoryImpl()


from app.infrastructure.mongodb.repository.chat_repository import ChatRepository


def get_chat_repository() -> ChatRepository:
    from app.infrastructure.mongodb.repository.chat_repository_impl import ChatRepositoryImpl
    return ChatRepositoryImpl()


def get_sse_service() -> SSEService:
    return SSEService(logger=logger)


def get_chat_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository),
        chat_repository: ChatRepository = Depends(get_chat_repository),
        sse_service: SSEService = Depends(get_sse_service)
) -> ChatService:
    model_generator = ModelGenerator()
    return ChatService(
        model_name="openai",
        model_generator=model_generator,
        diagram_repository=diagram_repository,
        chat_repository=chat_repository,
        sse_service=sse_service,
        logger=logger,
    )


#####################################################################################################
###############################         Controller        ###########################################
#####################################################################################################
from app.api.dto.diagram_dto import ChatResponse
@chat_router.get("/projects/{project_id}/apis/{api_id}/chats")
async def get_prompts(
        project_id: str,
        api_id: str,
        chat_service: ChatService = Depends(get_chat_service),
) -> ChatResponse:

    pass


@chat_router.post("/projects/{project_id}/apis/{api_id}/chats")
async def prompt_chat(
        project_id: str,
        api_id: str,
        user_chat_data: UserChatRequest,
        background_tasks: BackgroundTasks,
        chat_service: ChatService = Depends(get_chat_service),
        sse_service: SSEService = Depends(get_sse_service)
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
        sse_service: SSEService

    Returns:
        Dict[str, str]: SSE 연결을 위한 스트림 ID
    """
    logger.info(f"프롬프트 채팅 요청 시작: project_id={project_id}, api_id={api_id}")
    logger.debug(f"사용자 채팅 데이터: {user_chat_data}")

    try:
        # SSE 스트리밍을 위한 응답 큐 생성
        stream_id, response_queue = sse_service.create_stream()
        logger.info(f"SSE 스트림 생성: stream_id={stream_id}")

        # 채팅 및 다이어그램 처리를 백그라운드 태스크로 실행
        background_tasks.add_task(
            chat_service.process_chat_and_diagram,
            project_id,
            api_id,
            user_chat_data,
            response_queue
        )

        logger.info(f"백그라운드 태스크 등록 완료: stream_id={stream_id}")

        # 스트림 ID 반환
        return {"streamId": stream_id}
    except Exception as e:
        logger.error(f"채팅 처리 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@chat_router.get("/sse/connect/{sse_id}")
async def connect_sse(
        sse_id: str,
        sse_service: SSEService = Depends(get_sse_service)
):
    """
    SSE 연결을 설정하여 실시간 응답을 스트리밍 받습니다.

    Args:
        sse_id: SSE 연결 ID
        sse_service: SSEService

    Returns:
        StreamingResponse: 스트리밍 응답 객체
    """
    logger.info(f"SSE 연결 요청: sse_id={sse_id}")
    response_queue = sse_service.get_stream(sse_id)

    async def event_generator(response_queue):
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
            sse_service.remove_stream(sse_id)

    logger.info(f"SSE 스트리밍 응답 시작: sse_id={sse_id}")
    return StreamingResponse(event_generator(response_queue), media_type="text/event-stream")
