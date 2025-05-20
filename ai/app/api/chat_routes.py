import logging

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header
from fastapi.responses import StreamingResponse

from app.api.dto.diagram_dto import UserChatRequest
from app.config.config import settings
from app.core.diagram.component.component_service import ComponentService
from app.core.diagram.connection.connection_service import ConnectionService
from app.core.diagram.diagram_service import DiagramService
from app.core.llm.base_llm import LLMFactory, ModelType
from app.core.llm.chains.component_chain import ComponentChain
from app.core.llm.chains.connection_chain import ConnectionChain
from app.core.llm.chains.create_diagram_component_chain import CreateDiagramComponentChain
from app.core.llm.chains.dto_chain import DtoModelChain
from app.core.llm.chains.user_chat_chain import UserChatChain
from app.core.llm.prompt_service import PromptService
from app.core.services.chat_service import ChatService
from app.core.services.chat_service_facade import ChatServiceFacade
from app.core.services.sse_service import SSEService
from app.infrastructure.http.client.api_client import ApiClient, GlobalFileList, ApiSpec

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
    return SSEService()

def get_a_http_client():
    from app.infrastructure.http.client.api_client import ApiClient
    from app.config.config import settings
    return ApiClient(settings.A_HTTP_SPRING_BASE_URL)

def get_chat_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository),
        chat_repository: ChatRepository = Depends(get_chat_repository),
) -> ChatService:
    return ChatService(
        diagram_repository=diagram_repository,
        chat_repository=chat_repository,
    )

def get_prompt_service() -> PromptService:
    return PromptService(
        user_chat_chain=UserChatChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4_1,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=0.5,
                streaming=True,
                callbacks=[]  # 초기에는 빈 콜백 리스트
            )
        ),
        create_diagram_chain=CreateDiagramComponentChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4_1,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=0,
            )
        )
    )

def get_component_service() -> ComponentService:
    return ComponentService(
        component_chain=ComponentChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=0,
            )
        ),
        dto_chain=DtoModelChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=0,
            )
        )
    )

def get_connection_service() -> ConnectionService:
    from app.config.config import settings
    return ConnectionService(
        connection_chain=ConnectionChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=0,
            )
        )
    )

def get_diagram_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository),
) -> DiagramService:
    return DiagramService(
        diagram_repository=diagram_repository,
    )

def get_chat_service_facade(
        sse_service: SSEService = Depends(get_sse_service),
        chat_service: ChatService = Depends(get_chat_service),
        prompt_service: PromptService = Depends(get_prompt_service),
        diagram_service: DiagramService = Depends(get_diagram_service),
        component_service: ComponentService = Depends(get_component_service),
        connection_service: ConnectionService = Depends(get_connection_service),
) -> ChatServiceFacade:
    return ChatServiceFacade(
        sse_service=sse_service,
        chat_service=chat_service,
        prompt_service=prompt_service,
        diagram_service=diagram_service,
        component_service=component_service,
        connection_service=connection_service,
    )

#####################################################################################################
###############################         Controller        ###########################################
#####################################################################################################
from app.api.dto.diagram_dto import ChatResponseList


@chat_router.get("/projects/{project_id}/apis/{api_id}/chats")
async def get_prompts(
        project_id: str,
        api_id: str,
        chat_service_facade: ChatServiceFacade = Depends(get_chat_service_facade),
) -> ChatResponseList:
    """
    특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        chat_service_facade: ChatService

    Returns:
        ChatResponseList: 채팅 기록 목록
    """
    logger.info(f"채팅 기록 조회 요청: project_id={project_id}, api_id={api_id}")

    try:
        # 채팅 서비스를 통해 프롬프트 조회
        chat_responses = await chat_service_facade.get_prompts(project_id, api_id)
        logger.info(f"채팅 기록 조회 성공: {len(chat_responses.content)}개의 채팅")

        return chat_responses
    except Exception as e:
        logger.error(f"채팅 기록 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@chat_router.post("/projects/{project_id}/apis/{api_id}/chats")
async def prompt_chat(
        project_id: str,
        api_id: str,
        user_chat_data: UserChatRequest,
        background_tasks: BackgroundTasks,
        authorization: str = Header(None),
        chat_service_facade: ChatServiceFacade = Depends(get_chat_service_facade),
        sse_service: SSEService = Depends(get_sse_service),
        api_client: ApiClient = Depends(get_a_http_client)
):
    """
    프롬프트를 입력하여 도식화 수정을 요청하거나 설명을 요청합니다.
    응답 값으로 SSE Id를 받아 /api/sse/connect/{SSE_Id} API에 연결하여 응답을 스트리밍 받을 수 있습니다.

    이 API는 Langchain Agent를 사용하여 다음과 같이 작동합니다:
    1. 사용자 요청을 분석하여 MethodPromptTagEnum을 기반으로 도식화 생성 여부를 판단합니다.
    2. 도식화 생성이 필요한 경우:
       - SSE를 통해 "created" 이벤트로 diagramId를 클라이언트에게 전송합니다.
       - 비동기적으로 도식화를 생성합니다.
    3. 도식화 생성이 필요하지 않은 경우:
       - 단순 질문/답변 형태로 처리합니다.
    4. 모든 경우에 사용자 요청(UserChat)과 시스템 응답(SystemChat)이 Chat 도큐먼트로 MongoDB에 저장됩니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        user_chat_data: 사용자 채팅 데이터
        background_tasks: BackgroundTasks
        sse_service: SSEService
        api_client
        chat_service_facade
        authorization
    Returns:
        Dict[str, str]: SSE 연결을 위한 스트림 ID
    """

    try:
        logger.info(f"Authorization 헤더: {authorization}")


        api_spec: ApiSpec = await api_client.get_api_spec(api_spec_id=api_id, token=authorization)
        global_files: GlobalFileList = await api_client.get_project(project_id=project_id, token=authorization)

        # SSE 스트리밍을 위한 응답 큐 생성
        stream_id, response_queue = sse_service.create_stream()
        logger.info(f"SSE 스트림 생성: stream_id={stream_id}")

        # 채팅 및 다이어그램 처리를 백그라운드 태스크로 실행
        # Agent가 도식화 생성 여부를 판단하고, 필요한 경우 created 이벤트로 diagramId를 제공합니다
        background_tasks.add_task(
            chat_service_facade.create_chat,
            project_id,
            api_id,
            user_chat_data,
            global_files,
            api_spec,
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

    import asyncio
    async def event_generator(queue: asyncio.Queue):
        try:
            logger.info(f"SSE 이벤트 생성기 시작: sse_id={sse_id}")

            while True:
                # 큐에서 데이터 대기
                data = await queue.get()
                logger.info(f"{data}")

                # 종료 신호 확인
                if data is None:
                    logger.info(f"SSE 스트림 종료: sse_id={sse_id}")
                    break

                # SSE 형식으로 데이터 전송
                yield f"{data}\n\n"

        except Exception as e:
            logger.error(f"SSE 스트리밍 중 오류 발생: {str(e)}", exc_info=True)
        finally:
            # 클라이언트 연결 종료 시 정리
            logger.info(f"SSE 연결 정리: sse_id={sse_id}")

            await sse_service.close_stream(response_queue)
            sse_service.remove_stream(sse_id)

    logger.info(f"SSE 스트리밍 응답 시작: sse_id={sse_id}")
    return StreamingResponse(event_generator(response_queue), media_type="text/event-stream")
