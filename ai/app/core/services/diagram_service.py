import logging
from typing import Optional

from app.api.dto.diagram_dto import DiagramResponse, PositionRequest
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, Metadata, Component, DtoModel


class DiagramService:
    """
    다이어그램 관련 비즈니스 로직을 처리하는 서비스 클래스
    """

    def __init__(
            self,
            repository: Optional[DiagramRepository] = None,
            logger: Optional[logging.Logger] = None,
    ):
        """
        DiagramService 초기화

        Args:
            repository: DiagramRepository - 다이어그램 저장소
            logger: Logger - 로깅 객체
        """
        self.repository = repository
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info("DiagramService 초기화됨")

    async def get_diagram(self, project_id: str, api_id: str, version: int) -> DiagramResponse:
        """
        특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version: 버전

        Returns:
            DiagramResponse: 조회된 도식화 데이터

        Raises:
            ValueError: 다이어그램을 찾을 수 없을 경우
        """
        self.logger.info(f"도식화 데이터 조회: project_id={project_id}, api_id={api_id}, version_id={version}")

        # 다이어그램 조회
        diagram = await self.repository.find_by_project_api_version(project_id, api_id, version)

        if not diagram:
            self.logger.error(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}, version_id={version}")
            raise ValueError(f"다이어그램을 찾을 수 없습니다. (project_id={project_id}, api_id={api_id}, version_id={version})")

        # 응답 데이터로 변환
        return self._convert_to_response(diagram)

    async def create_diagram(self, project_id: str, api_id: str) -> DiagramResponse:
        """
        특정 프로젝트의 특정 API에 대한 새로운 다이어그램을 생성합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            DiagramResponse: 생성된 도식화 데이터

        Raises:
            Exception: 다이어그램 생성 실패 시
        """
        self.logger.info(f"새 다이어그램 생성: project_id={project_id}, api_id={api_id}")

        try:
            # 기존 다이어그램이 있는지 확인
            existing_diagram = await self.repository.find_latest_by_project_api(project_id, api_id)

            if existing_diagram:
                # 기존 다이어그램이 있으면 새 버전 생성
                self.logger.info(f"기존 다이어그램을 기반으로 새 버전 생성: project_id={project_id}, api_id={api_id}")
                new_diagram = await self.repository.create_new_version(existing_diagram)
            else:
                # 기존 다이어그램이 없으면 새로 생성
                self.logger.info(f"새 다이어그램 생성: project_id={project_id}, api_id={api_id}")

                diagram: Diagram = self.create_dummy_diagram(project_id, api_id)
                # 저장
                new_diagram = await self.repository.save(diagram)

            # 응답 데이터로 변환
            return self._convert_to_response(new_diagram)

        except Exception as e:
            self.logger.error(f"다이어그램 생성 실패: {str(e)}")
            raise Exception(f"다이어그램 생성에 실패했습니다: {str(e)}")

    async def update_component_position(
            self, project_id: str, api_id: str, component_id: str, position_data: PositionRequest
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
        self.logger.info(
            f"컴포넌트 위치 업데이트: project_id={project_id}, api_id={api_id}, "
            f"component_id={component_id}, x={position_data.x}, y={position_data.y}"
        )

        # 컴포넌트 위치 업데이트
        updated_diagram = await self.repository.update_component_position(
            project_id, api_id, component_id, position_data.x, position_data.y
        )

        if not updated_diagram:
            self.logger.error(
                f"컴포넌트를 찾을 수 없음: project_id={project_id}, api_id={api_id}, component_id={component_id}"
            )
            raise ValueError(f"컴포넌트를 찾을 수 없습니다. (component_id={component_id})")

        # 응답 데이터로 변환
        return self._convert_to_response(updated_diagram)

    def _convert_to_response(self, diagram: Diagram) -> DiagramResponse:
        """
        내부 Diagram 모델을 DiagramResponse DTO로 변환합니다.

        Args:
            diagram: Diagram 모델 객체

        Returns:
            DiagramResponse: 응답 형식으로 변환된 다이어그램 데이터
        """
        # 모델을 딕셔너리로 변환
        diagram_dict = diagram.model_dump()

        # 연결(connections)을 edges로 변환
        edges = diagram_dict.pop("connections", [])

        # DiagramResponse 형식에 맞게 데이터 구성
        response_data = {
            "diagramId": diagram_dict["diagramId"],
            "version": diagram_dict["metadata"]["version"],
            "metadata": diagram_dict["metadata"],
            "components": diagram_dict["components"],
            "edges": edges,
            "apiId": diagram_dict["apiId"],
            "projectId": diagram_dict["projectId"],
            "apiSpec": {},  # 필요한 경우 API 스펙 데이터 추가
            "apiSpecUrl": "",  # 필요한 경우 API 스펙 URL 추가
        }

        return DiagramResponse(**response_data)

    def create_dummy_diagram(self, project_id: str, api_id: str) -> Diagram:
        from app.infrastructure.mongodb.repository.model.diagram_model import ComponentTypeEnum, Method, Connection, \
            MethodConnectionTypeEnum
        import uuid

        # UUID 생성을 위한 인스턴스 생성
        method1_id = str(uuid.uuid4())
        method2_id = str(uuid.uuid4())
        method3_id = str(uuid.uuid4())
        method4_id = str(uuid.uuid4())

        components = [
            Component(
                componentId=str(uuid.uuid4()),
                type=ComponentTypeEnum.INTERFACE,
                name="UserInterface",
                description="사용자 관련 작업을 처리하는 인터페이스",
                positionX=100.0,
                positionY=150.0,
                methods=[
                    Method(
                        methodId=method1_id,
                        name="getUser",
                        signature="getUser(userId: string): User",
                        body="return userRepository.findById(userId);",
                        description="사용자 ID로 사용자 정보를 조회합니다",
                    ),
                    Method(
                        methodId=method2_id,
                        name="createUser",
                        signature="createUser(user: User): void",
                        body="userRepository.save(user);",
                        description="새로운 사용자를 생성합니다",
                    )
                ]
            ),
            Component(
                componentId=str(uuid.uuid4()),
                type=ComponentTypeEnum.CLASS,
                name="UserServiceImpl",
                description="사용자 서비스 구현 클래스",
                positionX=350.0,
                positionY=150.0,
                methods=[
                    Method(
                        methodId=method3_id,
                        name="getUserById",
                        signature="getUserById(id: string): UserDto",
                        body="User user = userRepository.findById(id);\nreturn userMapper.toDto(user);",
                        description="사용자 ID로 사용자 정보를 DTO로 변환하여 반환합니다",
                    ),
                    Method(
                        methodId=method4_id,
                        name="registerUser",
                        signature="registerUser(userDto: UserDto): void",
                        body="User user = userMapper.toEntity(userDto);\nuserRepository.save(user);",
                        description="DTO를 이용해 새로운 사용자를 등록합니다",
                    )
                ]
            )
        ]

        connections = [
            Connection(
                connectionId=str(uuid.uuid4()),
                sourceMethodId=method1_id,
                targetMethodId=method3_id,
                type=MethodConnectionTypeEnum.SOLID,
            ),
            Connection(
                connectionId=str(uuid.uuid4()),
                sourceMethodId=method2_id,
                targetMethodId=method4_id,
                type=MethodConnectionTypeEnum.SOLID,
            )
        ]

        dto = [
            DtoModel(
                dtoId=str(uuid.uuid4()),
                name="UserDto",
                description="사용자 정보 전송 객체",
                body="""
{
  "id": "string",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "ADMIN | USER"
}
"""
            ),
            DtoModel(
                dtoId=str(uuid.uuid4()),
                name="LoginDto",
                description="로그인 정보 전송 객체",
                body="""
{
  "username": "string",
  "password": "string"
}
"""
            )
        ]

        from datetime import datetime
        # 기본 메타데이터 생성
        metadata = Metadata(
            metadataId=str(uuid.uuid4()),
            version=1,
            lastModified=datetime.now(),
            name=f"API {api_id}",
            description=f"Diagram for API {api_id}"
        )

        # 새 다이어그램 생성
        return Diagram(
            projectId=project_id,
            apiId=api_id,
            diagramId=str(uuid.uuid4()),
            components=components,
            connections=connections,
            dto=dto,
            metadata=metadata
        )
