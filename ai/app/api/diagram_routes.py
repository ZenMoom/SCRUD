import logging

from fastapi import APIRouter, Depends, HTTPException, Header

from app.api.dto.diagram_dto import PositionRequest, DiagramResponse
from app.config.config import settings
from app.core.diagram.component.component_service import ComponentService
from app.core.diagram.connection.connection_service import ConnectionService
from app.core.diagram.diagram_facade import DiagramFacade
from app.core.diagram.diagram_service import DiagramService
from app.core.llm.base_llm import LLMFactory, ModelType
from app.core.llm.chains.component_chain import ComponentChain
from app.core.llm.chains.connection_chain import ConnectionChain
from app.core.llm.chains.create_diagram_chain import CreateDiagramChain
from app.core.llm.chains.dto_chain import DtoModelChain
from app.core.llm.chains.user_chat_chain import UserChatChain
from app.core.llm.prompt_service import PromptService
from app.core.services.sse_service import SSEService
from app.infrastructure.http.client.api_client import ApiClient, ApiSpec, GlobalFileList

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 라우터 생성
diagram_router = APIRouter()

# 의존성 주입을 위한 함수
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository


def get_diagram_repository() -> DiagramRepository:
    from app.infrastructure.mongodb.repository.diagram_repository_impl import DiagramRepositoryImpl
    return DiagramRepositoryImpl()


from app.infrastructure.mongodb.repository.chat_repository import ChatRepository


def get_chat_repository() -> ChatRepository:
    from app.infrastructure.mongodb.repository.chat_repository_impl import ChatRepositoryImpl
    return ChatRepositoryImpl()


def get_diagram_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository)
) -> DiagramService:
    return DiagramService(
        diagram_repository=diagram_repository,
    )

def get_component_service() -> ComponentService:
    return ComponentService(
        component_chain=ComponentChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        ),
        dto_chain=DtoModelChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        )
    )

def get_connection_service() -> ConnectionService:
    return ConnectionService(
        connection_chain=ConnectionChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        )
    )

def get_prompt_service() -> PromptService:
    return PromptService(
        create_diagram_chain=CreateDiagramChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        ),
        user_chat_chain=UserChatChain(
            LLMFactory.create_llm(
                model=ModelType.OPENAI_GPT4,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        ),
    )
def get_diagram_service_facade(
        component_service: ComponentService = Depends(get_component_service),
        connection_service: ConnectionService = Depends(get_connection_service),
        prompt_service: PromptService = Depends(get_prompt_service),
        diagram_service: DiagramService = Depends(get_diagram_service),
) -> DiagramFacade:
    return DiagramFacade(
        component_service=component_service,
        connection_service=connection_service,
        prompt_service=prompt_service,
        diagram_service=diagram_service,
    )

def get_sse_service() -> SSEService:
    return SSEService()

def get_a_http_client():
    from app.infrastructure.http.client.api_client import ApiClient
    from app.config.config import settings
    return ApiClient(settings.A_HTTP_SPRING_BASE_URL)

#####################################################################################################
###############################         Controller        ###########################################
#####################################################################################################

@diagram_router.get("/projects/{project_id}/apis/{api_id}/versions/{version}")
async def get_diagram(
        project_id: str,
        api_id: str,
        version: int,
        diagram_service_facade: DiagramFacade = Depends(get_diagram_service_facade),
) -> DiagramResponse:
    """
    특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

    Args:
        diagram_service_facade: DiagramService
        project_id: 프로젝트 ID
        api_id: API ID
        version: 버전
        diagram_service_facade
    Returns:
        Diagram: 조회된 도식화 데이터
    """

    return await diagram_service_facade.get_diagram(project_id, api_id, version)


@diagram_router.post("/projects/{project_id}/apis/{api_id}/diagrams")
async def create_diagram(
        project_id: str,
        api_id: str,
        diagram_service_facade: DiagramFacade = Depends(get_diagram_service_facade),
        authorization: str = Header(None),
        api_client: ApiClient = Depends(get_a_http_client)
) -> DiagramResponse:
    """
    특정 프로젝트와 API에 대한 새로운 다이어그램을 생성합니다.

    Args:
        diagram_service_facade: DiagramService
        project_id: 프로젝트 ID
        api_id: API ID
        api_client
        authorization

    Returns:
        Diagram: 생성된 도식화 데이터
        
    Raises:
        HTTPException: 400 - 이미 다이어그램이 존재하는 경우
        HTTPException: 500 - 서버 오류가 발생한 경우
    """
    logger.info(f"Authorization 헤더: {authorization}")

    try:
        api_spec: ApiSpec = await api_client.get_api_spec(api_spec_id=api_id, token=authorization)
        global_files: GlobalFileList = await api_client.get_project(project_id=project_id, token=authorization)
        logger.info(f"API Spec: {api_spec.model_dump_json(indent=2) if api_spec else '{empty}'}")
        logger.info(f"Project Data: {global_files.model_dump_json(indent=2) if global_files else '{empty}'}")

        return await diagram_service_facade.create_diagram(
            project_id=project_id,
            api_id=api_id,
            api_spec=api_spec,
            global_files=global_files
        )

    except ValueError as e:
        # 이미 존재하는 다이어그램인 경우 400 에러
        logger.warning(f"다이어그램 생성 실패: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 기타 오류는 500 에러
        logger.error(f"다이어그램 생성 중 서버 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")


@diagram_router.put("/projects/{project_id}/apis/{api_id}/components/{component_id}/position")
async def update_component_position(
        project_id: str,
        api_id: str,
        component_id: str,
        position_data: PositionRequest,
        diagram_service_facade: DiagramFacade = Depends(get_diagram_service_facade),
) -> DiagramResponse:
    """
    도식화에서 특정 컴포넌트의 위치 좌표를 변경합니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        component_id: 컴포넌트 ID
        position_data: 새 위치 데이터 (x, y 좌표)
        diagram_service_facade: DiagramService
    Returns:
        Component: 업데이트된 컴포넌트 정보
    """
    try:
        return await diagram_service_facade.update_component_position(
            project_id,
            api_id,
            component_id,
            position_data
        )

    except ValueError as e:
        # 이미 존재하는 다이어그램인 경우 400 에러
        logger.warning(f"다이어그램 생성 실패 (기존 다이어그램 존재): {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 기타 오류는 500 에러
        logger.error(f"다이어그램 생성 중 서버 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
