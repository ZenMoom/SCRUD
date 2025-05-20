import logging
import uuid
from datetime import datetime
from typing import List, Optional

from app.api.dto.diagram_dto import DiagramResponse, PositionRequest
from app.core.models.diagram_model import ComponentChainPayload, DtoModelChainPayload, ConnectionChainPayload
from app.core.models.user_chat_model import UserChatChainPayload
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import DtoModel, Component, Connection, Diagram, \
    Metadata

logger = logging.getLogger(__name__)


class DiagramService:
    def __init__(
            self,
            diagram_repository: DiagramRepository,
    ):
        self.diagram_repository = diagram_repository

    async def get_diagram(self, project_id: str, api_id: str, version: int) -> DiagramResponse:

        logger.info(f"도식화 데이터 조회: project_id={project_id}, api_id={api_id}, version_id={version}")

        # 다이어그램 조회
        diagram = await self.diagram_repository.find_by_project_api_version(project_id, api_id, version)

        if not diagram:
            logger.error(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}, version_id={version}")
            raise ValueError(f"다이어그램을 찾을 수 없습니다. (project_id={project_id}, api_id={api_id}, version_id={version})")

        # 응답 데이터로 변환
        return DiagramResponse.model_validate(diagram)

    async def _find_latest_diagram_version(
            self,
            project_id: str,
            api_id: str,
    ) -> int:
        """최신 다이어그램을 조회하는 함수"""
        latest_diagram = await self.diagram_repository.find_latest_by_project_api(project_id, api_id)

        if latest_diagram:
            return latest_diagram.metadata.version
        else:
            return 0

    async def create_diagram(
            self,
            diagram_id: str,
            components: List[Component],
            connections: List[Connection],
            dtos: List[DtoModel],
            project_id: Optional[str] = "",
            api_id: Optional[str] = "",
            summary: Optional[str] = "구현",

    ) -> Diagram:
        """다이어그램 생성

        Args:
            diagram_id
            components: 컴포넌트 목록
            connections: 커넥션 목록
            dtos: DTO 모델 목록
            project_id: 프로젝트 ID (선택)
            api_id: API ID (선택)

        Returns:
            생성된 다이어그램
        """
        logger.debug("Creating diagram")
        latest_diagram_version = await self._find_latest_diagram_version(
            project_id=project_id,
            api_id=api_id
        )

        metadata = Metadata(
            metadataId=str(uuid.uuid4()),
            version=latest_diagram_version + 1, # 최신 버전 다이어그램 보다 1 높게 설정
            name="name",
            description=summary,
            lastModified=datetime.now(),
        )

        diagram = Diagram(
            projectId=project_id,
            apiId=api_id,
            diagramId=diagram_id,
            components=components,
            connections=connections,
            dto=dtos,
            metadata=metadata
        )

        logger.info(f"Created diagram with ID: {diagram_id}")
        await self.diagram_repository.save(diagram)
        return diagram

    async def create_diagram_from_prompt_result(
            self,
            diagram_id: str,
            project_id: str,
            api_id: str,
            components: List[ComponentChainPayload],
            dtos: List[DtoModelChainPayload],
            connections: List[ConnectionChainPayload],
            summary: str,
    ) -> Diagram:
        """프롬프트 결과로부터 다이어그램 생성

        Args:
            diagram_id
            project_id: 프로젝트 ID (선택)
            api_id: API ID (선택)
            components
            dtos
            connections
            summary
        Returns:
            생성된 다이어그램
        """
        logger.info("Creating diagram from prompt result")
        component_converted = self.convert_to_component_from_payload(components)
        logger.info(f"converted components: {component_converted}")
        connection_converted = self.convert_to_connection_from_payload(connections)
        logger.info(f"converted connections: {connection_converted}")
        dto_converted = self.convert_to_dto_from_payload(dtos)
        logger.info(f"converted dtos: {dto_converted}")

        return await self.create_diagram(
            diagram_id=diagram_id,
            project_id=project_id,
            api_id=api_id,
            components=component_converted,
            connections=connection_converted,
            dtos=dto_converted,
            summary=summary
        )

    async def validate_exist_diagram(
            self,
            project_id: str,
            api_id: str,
    ):
        # 기존 다이어그램이 있는지 조회
        logger.info(f"다이어그램 존재 여부 확인: project_id={project_id}, api_id={api_id}")

        existing_diagrams = await self.diagram_repository.find_many({
            "projectId": project_id,
            "apiId": api_id
        })

        if existing_diagrams and len(existing_diagrams) > 0:
            logger.warning(f"이미 존재하는 다이어그램: project_id={project_id}, api_id={api_id}")
            raise ValueError(f"이미 존재하는 다이어그램입니다. (project_id={project_id}, api_id={api_id})")

    def convert_to_dto_from_payload(self, dtos: List[DtoModelChainPayload]) -> List[DtoModel]:
        return [
            DtoModel.model_validate(
                {
                    **d.model_dump(),
                    "dtoId": str(uuid.uuid4()),
                }
            ) for d in dtos]

    def convert_to_connection_from_payload(self, connections: List[ConnectionChainPayload]):
        return [
            Connection.model_validate(
                {
                    **c.model_dump(),
                    "connectionId": str(uuid.uuid4()),
                }
            ) for c in connections]

    def convert_to_component_from_payload(self, components: List[ComponentChainPayload]) -> List[Component]:
        # 혹시 안되면 쓰기
        # methods = []
        # for c in components:
        #     method_payloads = c.methods
        #     for m in method_payloads:
        #         methods.append(Method.model_validate(m))

        return [Component.model_validate(
            {
                **c.model_dump(),
                "componentId": str(uuid.uuid4()),
            }
        ) for c in components]

    @staticmethod
    def _convert_payload(chat_data) -> UserChatChainPayload:
        return UserChatChainPayload(
            tag=chat_data.tag.value,
            promptType=chat_data.promptType.value,
            message=chat_data.message,
            targetMethods=chat_data.targetMethods,
        )

    async def update_component_position(
            self,
            project_id: str,
            api_id: str,
            component_id: str,
            position_data: PositionRequest
    ) -> DiagramResponse:

        logger.info(
            f"컴포넌트 위치 업데이트: project_id={project_id}, api_id={api_id}, "
            f"component_id={component_id}, x={position_data.x}, y={position_data.y}"
        )

        # 컴포넌트 위치 업데이트
        updated_diagram = await self.diagram_repository.update_component_position(
            project_id, api_id, component_id, position_data.x, position_data.y
        )

        if not updated_diagram:
            logger.error(
                f"컴포넌트를 찾을 수 없음: project_id={project_id}, api_id={api_id}, component_id={component_id}"
            )
            raise ValueError(f"컴포넌트를 찾을 수 없습니다. (component_id={component_id})")

        # 응답 데이터로 변환
        return DiagramResponse.model_validate(updated_diagram)
