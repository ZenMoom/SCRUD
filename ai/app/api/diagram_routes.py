import logging

from fastapi import APIRouter, Depends, HTTPException, Header

from app.api.chat_routes import get_model_generator
from app.api.dto.diagram_dto import PositionRequest, DiagramResponse
from app.core.generator.model_generator import ModelGenerator
from app.core.services.chat_service import ChatService
from app.core.services.diagram_service import DiagramService
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
        logger=logger,
    )

def get_sse_service() -> SSEService:
    return SSEService(logger=logger)

def get_a_http_client():
    from app.infrastructure.http.client.api_client import ApiClient
    from app.config.config import settings
    return ApiClient(settings.A_HTTP_SPRING_BASE_URL)

def get_chat_service(
        diagram_repository: DiagramRepository = Depends(get_diagram_repository),
        chat_repository: ChatRepository = Depends(get_chat_repository),
        sse_service: SSEService = Depends(get_sse_service),
        model_generator: ModelGenerator = Depends(get_model_generator),
) -> ChatService:
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
        authorization: str = Header(None),
        api_client: ApiClient = Depends(get_a_http_client)
) -> DiagramResponse:
    """
    특정 프로젝트와 API에 대한 새로운 다이어그램을 생성합니다.

    Args:
        diagram_service: DiagramService
        project_id: 프로젝트 ID
        api_id: API ID

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
        logger.info(f"API Spec: {api_spec}")
        logger.info(f"Project Data: {global_files}")
        return await diagram_service.create_diagram(
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
    try:
        return await diagram_service.update_component_position(
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
