import logging
import uuid
from typing import List

from app.api.dto.diagram_dto import DiagramResponse, PositionRequest
from app.core.diagram.component.component_service import ComponentService
from app.core.diagram.connection.connection_service import ConnectionService
from app.core.diagram.diagram_service import DiagramService
from app.core.llm.prompt_service import PromptService
from app.core.models.diagram_model import ComponentChainPayload
from app.core.models.global_setting_model import ApiSpecChainPayload
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram

logger = logging.getLogger(__name__)

class DiagramFacade:
    def __init__(
            self,
            component_service: ComponentService,
            connection_service: ConnectionService,
            prompt_service: PromptService,
            diagram_service: DiagramService
    ):
        self._prompt_service = prompt_service
        self._component_service = component_service
        self._connection_service = connection_service
        self._diagram_service = diagram_service
        self.logger = logging.getLogger(__name__)

    async def get_diagram(
            self,
            project_id: str,
            api_id: str,
            version: int,
    ):
        self.logger.info(f"[디버깅] DiagramFacade - get_diagram 메소드 시작: project_id={project_id}, api_id={api_id}, version={version}")
        
        try:
            result = await self._diagram_service.get_diagram(project_id, api_id, version)
            self.logger.info(f"[디버깅] DiagramFacade - get_diagram 성공: 다이어그램 조회 완료")
            return result
        except Exception as e:
            self.logger.error(f"[디버깅] DiagramFacade - get_diagram 실패: {str(e)}")
            raise

    async def update_component_position(
            self,
            project_id: str,
            api_id: str,
            component_id: str,
            position_data: PositionRequest
    ) -> DiagramResponse:
        """
        도식화에서 특정 컴포넌트의 위치 좌표를 변경합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            component_id: 컴포넌트 ID
            position_data: 새 위치 데이터 (x, y 좌표)

        Returns:
            DiagramResponse: 업데이트된 다이어그램 정보

        Raises:
            ValueError: 컴포넌트를 찾을 수 없을 경우
        """
        self.logger.info(f"[디버깅] DiagramFacade - update_component_position 메소드 시작")
        self.logger.info(f"[디버깅] DiagramFacade - 파라미터: project_id={project_id}, api_id={api_id}, component_id={component_id}")
        self.logger.info(f"[디버깅] DiagramFacade - 위치 데이터: x={position_data.x}, y={position_data.y}")

        try:
            result = await self._diagram_service.update_component_position(
                project_id=project_id,
                api_id=api_id,
                component_id=component_id,
                position_data=position_data
            )
            self.logger.info(f"[디버깅] DiagramFacade - update_component_position 성공: 컴포넌트 위치 업데이트 완료")
            return result
        except Exception as e:
            self.logger.error(f"[디버깅] DiagramFacade - update_component_position 실패: {str(e)}")
            raise

    async def create_diagram(
            self,
            project_id: str,
            api_id: str,
            api_spec: ApiSpec,
            global_files: GlobalFileList,
    ):
        self.logger.info(f"[디버깅] DiagramFacade - create_diagram 메소드 시작")
        self.logger.info(f"[디버깅] DiagramFacade - 파라미터: project_id={project_id}, api_id={api_id}")
        
        # API 스펙 및 글로벌 파일 요약 로그
        api_spec_info = f"ID: {api_spec.apiSpecVersionId if hasattr(api_spec, 'apiSpecVersionId') else 'N/A'}, 경로: {api_spec.endpoint[:30] if hasattr(api_spec, 'endpoint') else 'N/A'}{'...' if hasattr(api_spec, 'endpoint') and len(api_spec.endpoint) > 30 else ''}"
        self.logger.info(f"[디버깅] DiagramFacade - API 스펙: {api_spec_info}")
        
        file_count = len(global_files.content) if hasattr(global_files, 'content') else 0
        self.logger.info(f"[디버깅] DiagramFacade - 글로벌 파일 개수: {file_count}")
        
        try:
            self.logger.info("[디버깅] DiagramFacade - 다이어그램 유효성 검증 시작")
            await self._diagram_service.validate_exist_diagram(
                project_id=project_id,
                api_id=api_id,
            )
            self.logger.info("[디버깅] DiagramFacade - 다이어그램 유효성 검증 완료")

            diagram_id = str(uuid.uuid4())
            self.logger.info(f"[디버깅] DiagramFacade - 새 다이어그램 ID 생성: {diagram_id}")
            
            self.logger.info("[디버깅] DiagramFacade - LLM 호출 시작")
            diagram: Diagram = await self._call_llm(
                diagram_id=diagram_id,
                api_spec=api_spec,
                global_files=global_files,
                api_id=api_id,
                project_id=project_id,
            )
            self.logger.info(f"[디버깅] DiagramFacade - LLM 호출 완료: 다이어그램 버전={diagram.metadata.version if hasattr(diagram, 'metadata') else 'N/A'}")

            response = DiagramResponse.model_validate(diagram)
            self.logger.info("[디버깅] DiagramFacade - create_diagram 메소드 완료")
            return response
        except Exception as e:
            self.logger.error(f"[디버깅] DiagramFacade - create_diagram 실패: {str(e)}")
            raise

    async def _call_llm(
            self,
            project_id: str,
            api_id: str,
            diagram_id: str,
            api_spec: ApiSpec,
            global_files: GlobalFileList,
    ) -> Diagram:
        """프롬프트 결과로부터 다이어그램 생성

        Args:
            diagram_id
            api_spec: 프롬프트 처리 결과
            project_id: 프로젝트 ID (선택)
            api_id: API ID (선택)
            global_files
        Returns:
            생성된 다이어그램
        """
        self.logger.info(f"[디버깅] DiagramFacade - _call_llm 메소드 시작: diagram_id={diagram_id}")
        
        self.logger.info("[디버깅] DiagramFacade - API 스펙 프롬프트 처리 시작")
        components: List[ComponentChainPayload] = await self._prompt_service.process_api_spec_flow(
            api_spec=api_spec,
            global_files=global_files
        )
        self.logger.info(f"[디버깅] DiagramFacade - API 스펙 프롬프트 처리 완료: 컴포넌트 {len(components)}개 생성")

        self.logger.info("[디버깅] DiagramFacade - DTO 생성 시작")
        dtos = await self._component_service.create_dtos_with_api_spec(
            api_spec=ApiSpecChainPayload.model_validate(api_spec),
            components=components,
        )
        self.logger.info(f"[디버깅] DiagramFacade - DTO 생성 완료: {len(dtos)}개 DTO 생성")

        self.logger.info("[디버깅] DiagramFacade - 커넥션 생성 시작")
        connections = await self._connection_service.create_connection_with_prompt(components)
        self.logger.info(f"[디버깅] DiagramFacade - 커넥션 생성 완료: {len(connections)}개 커넥션 생성")

        self.logger.info("[디버깅] DiagramFacade - 다이어그램 생성 시작")
        diagram = await self._diagram_service.create_diagram_from_prompt_result(
            diagram_id=diagram_id,
            project_id=project_id,
            api_id=api_id,
            components=components,
            dtos=dtos,
            connections=connections,
        )
        self.logger.info(f"[디버깅] DiagramFacade - 다이어그램 생성 완료: 다이어그램 ID={diagram_id}")
        self.logger.info("[디버깅] DiagramFacade - _call_llm 메소드 완료")
        
        return diagram