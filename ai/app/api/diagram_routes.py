import logging

from fastapi import APIRouter, Depends

from app.api.dto.diagram_dto import PositionRequest, DiagramResponse
from app.core.generator.model_generator import ModelGenerator
from app.core.services.chat_service import ChatService
from app.core.services.diagram_service import DiagramService

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
        repository=diagram_repository,
        logger=logger,
    )


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


#####################################################################################################
###############################         Controller        ###########################################
#####################################################################################################

@diagram_router.get("/projects/{project_id}/apis/{api_id}/versions/{version}")
async def get_diagram(
        project_id: str,
        api_id: str,
        version: int,
        diagram_service: DiagramService = Depends(get_diagram_service),
) -> DiagramResponse:
    """
    특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

    Args:
        diagram_service: DiagramService
        project_id: 프로젝트 ID
        api_id: API ID
        version: 버전

    Returns:
        Diagram: 조회된 도식화 데이터
    """

    return await diagram_service.get_diagram(project_id, api_id, version)


@diagram_router.post("/projects/{project_id}/apis/{api_id}/diagrams")
async def create_diagram(
        project_id: str,
        api_id: str,
        diagram_service: DiagramService = Depends(get_diagram_service),
) -> DiagramResponse:
    """
    특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

    Args:
        diagram_service: DiagramService
        project_id: 프로젝트 ID
        api_id: API ID

    Returns:
        Diagram: 조회된 도식화 데이터
    """

    return await diagram_service.create_diagram(project_id, api_id)


@diagram_router.put("/projects/{project_id}/apis/{api_id}/components/{component_id}/position")
async def update_component_position(
        project_id: str,
        api_id: str,
        component_id: str,
        position_data: PositionRequest,
        diagram_service: DiagramService = Depends(get_diagram_service),
) -> DiagramResponse:
    """
    도식화에서 특정 컴포넌트의 위치 좌표를 변경합니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        component_id: 컴포넌트 ID
        position_data: 새 위치 데이터 (x, y 좌표)
        diagram_service: DiagramService
    Returns:
        Component: 업데이트된 컴포넌트 정보
    """

    return await diagram_service.update_component_position(
        project_id,
        api_id,
        component_id,
        position_data
    )
