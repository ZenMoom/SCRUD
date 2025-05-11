import logging
import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import asyncio

from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.diagram_repository_impl import DiagramRepositoryImpl
from app.infrastructure.mongodb.repository.model.diagram_model import (
    Diagram, Component, UserChat, SystemChat, Chat, PromptResponseEnum
)
from app.core.services.chat_service import ChatService
from app.core.generator.model_generator import ModelGenerator

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                  format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 라우터 생성
router = APIRouter()

# 의존성 주입을 위한 함수
def get_diagram_repository() -> DiagramRepository:
    return DiagramRepositoryImpl()

def get_chat_service(diagram_repository: DiagramRepository = Depends(get_diagram_repository)) -> ChatService:
    model_generator = ModelGenerator()
    return ChatService(model_name="openai", model_generator=model_generator, repository=diagram_repository)

# SSE 스트리밍을 위한 클라이언트 매핑
sse_clients = {}

@router.get("/api/v1/projects/{project_id}/apis/{api_id}/versions/{version_id}", tags=["Canvas"])
async def get_diagram(
    project_id: str,
    api_id: str,
    version_id: str,
    diagram_repository: DiagramRepository = Depends(get_diagram_repository)
):
    """
    특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        version_id: 버전 ID

    Returns:
        Diagram: 조회된 도식화 데이터
    """
    logger.info(f"다이어그램 조회 요청: project_id={project_id}, api_id={api_id}, version_id={version_id}")

    try:
        diagram = await diagram_repository.get_diagram_by_version(project_id, api_id, version_id)

        if not diagram:
            logger.warning(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}, version_id={version_id}")
            raise HTTPException(status_code=404, detail="다이어그램을 찾을 수 없습니다.")

        logger.info(f"다이어그램 조회 성공: diagramId={diagram.diagramId}, version={diagram.metadata.version}")
        # 디버깅을 위한 컴포넌트 개수 로깅
        logger.debug(f"다이어그램 컴포넌트 개수: {len(diagram.components)}")
        logger.debug(f"다이어그램 연결 개수: {len(diagram.connections)}")

        return diagram
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"다이어그램 조회 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.put("/api/v1/projects/{project_id}/apis/{api_id}/components/{component_id}/position", tags=["Component"])
async def update_component_position(
    project_id: str,
    api_id: str,
    component_id: str,
    position_data: Dict[str, float],
    diagram_repository: DiagramRepository = Depends(get_diagram_repository)
):
    """
    도식화에서 특정 컴포넌트의 위치 좌표를 변경합니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        component_id: 컴포넌트 ID
        position_data: 새 위치 데이터 (x, y 좌표)

    Returns:
        Component: 업데이트된 컴포넌트 정보
    """
    logger.info(f"컴포넌트 위치 업데이트 요청: project_id={project_id}, api_id={api_id}, component_id={component_id}")
    logger.debug(f"위치 데이터: {position_data}")

    try:
        # 위치 데이터 유효성 검사
        if 'x' not in position_data or 'y' not in position_data:
            logger.warning(f"잘못된 위치 데이터 형식: {position_data}")
            raise HTTPException(status_code=400, detail="position_data에는 x와 y 좌표가 모두 포함되어야 합니다.")

        logger.info(f"컴포넌트 이동: x={position_data['x']}, y={position_data['y']}")

        # 컴포넌트 위치 업데이트
        updated_component = await diagram_repository.update_component_position(
            project_id, api_id, component_id, position_data['x'], position_data['y']
        )

        if not updated_component:
            logger.warning(f"컴포넌트를 찾을 수 없음: component_id={component_id}")
            raise HTTPException(status_code=404, detail="컴포넌트를 찾을 수 없습니다.")

        logger.info(f"컴포넌트 위치 업데이트 성공: component_id={updated_component.componentId}, name={updated_component.name}")
        logger.debug(f"업데이트된 위치: x={updated_component.positionX}, y={updated_component.positionY}")

        return updated_component
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"컴포넌트 위치 업데이트 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.post("/api/v1/projects/{project_id}/apis/{api_id}/chats", tags=["Chat"])
async def prompt_chat(
    project_id: str,
    api_id: str,
    user_chat_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    diagram_repository: DiagramRepository = Depends(get_diagram_repository),
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    프롬프트를 입력하여 도식화 수정을 요청하거나 설명을 요청합니다.
    응답 값으로 SSE Id를 받아 /api/sse/connect/{SSE_Id} API에 연결하여 응답을 스트리밍 받을 수 있습니다.

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        user_chat_data: 사용자 채팅 데이터

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

        # 시스템 응답 초기화
        system_chat_data = {
            "systemChatId": str(uuid.uuid4()),
            "status": PromptResponseEnum.EXPLANATION,
            "message": "Processing your request..."
        }

        logger.info(f"시스템 채팅 초기화: systemChatId={system_chat_data['systemChatId']}")

        # 채팅 및 다이어그램 처리를 백그라운드 태스크로 실행
        background_tasks.add_task(
            process_chat_and_diagram,
            project_id,
            api_id,
            user_chat_data,
            system_chat_data,
            diagram_repository,
            chat_service,
            response_queue
        )

        logger.info(f"백그라운드 태스크 등록 완료: stream_id={stream_id}")

        # 스트림 ID 반환
        return {"streamId": stream_id}
    except Exception as e:
        logger.error(f"채팅 처리 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

@router.get("/api/sse/connect/{sse_id}", tags=["Chat"])
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
    user_chat_data: Dict[str, Any],
    system_chat_data: Dict[str, Any],
    diagram_repository: DiagramRepository,
    chat_service: ChatService,
    response_queue: asyncio.Queue
):
    """
    채팅 요청을 처리하고 필요한 경우 다이어그램을 업데이트하는 백그라운드 태스크

    Args:
        project_id: 프로젝트 ID
        api_id: API ID
        user_chat_data: 사용자 채팅 데이터
        system_chat_data: 초기 시스템 응답 데이터
        diagram_repository: 다이어그램 저장소
        chat_service: 채팅 서비스
        response_queue: 응답 데이터를 전송할 큐
    """
    logger.info(f"채팅 및 다이어그램 처리 백그라운드 태스크 시작: project_id={project_id}, api_id={api_id}")

    try:
        # 진행 상황 메시지 전송
        await response_queue.put(json.dumps({
            "type": "progress",
            "data": "다이어그램 처리 중..."
        }))

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
        openapi_spec = ""  # 실제 구현에서는 OpenAPI 명세를 가져와야 함

        logger.info("다이어그램 생성/수정 처리 중")

        # TODO: 실제 다이어그램 생성 로직 구현
        asyncio.create_task(chat_service.create_diagram_from_openapi(openapi_spec, response_queue))

        # 여기서는 간단히 LLM을 통한 처리를 생략하고 기존 다이어그램의 버전만 업데이트

        # 진행 상황 메시지 전송
        # await response_queue.put(json.dumps({
        #     "type": "progress",
        #     "data": "다이어그램 생성 완료, 저장 중..."
        # }))

        # 최종 응답 상태 설정
        system_chat_data["status"] = PromptResponseEnum.MODIFIED
        system_chat_data["message"] = "다이어그램이 성공적으로 업데이트되었습니다."

        logger.info(f"채팅 및 다이어그램 저장 시작: status={system_chat_data['status']}")

        # 채팅 및 다이어그램 저장
        chat_id = await diagram_repository.create_chat_and_diagram(
            project_id, api_id, user_chat_data, system_chat_data
        )

        logger.info(f"채팅 및 다이어그램 저장 완료: chatId={chat_id}")

        # 최종 응답 전송
        final_response = {
            "type": "complete",
            "data": system_chat_data
        }

        await response_queue.put(json.dumps(final_response))
        logger.info("최종 응답 전송 완료")

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