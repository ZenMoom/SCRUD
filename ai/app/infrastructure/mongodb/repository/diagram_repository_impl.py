import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram
from app.infrastructure.mongodb.repository.mongo_repository_impl import MongoRepositoryImpl


class DiagramRepositoryImpl(DiagramRepository):
    """
    MongoDB를 사용한 다이어그램 저장소 구현
    """

    def __init__(self):
        """
        DiagramRepositoryImpl 초기화
        """
        self.repository = MongoRepositoryImpl("diagrams", Diagram)

    async def find_many(self, fileter_dict: Dict[str, Any], sort: Optional[list] = None) -> list:
        return await self.repository.find_many(fileter_dict, sort)

    async def find_one(self, fileter_dict: Dict[str, Any]) -> Optional[Diagram]:
        return await self.repository.find_one(fileter_dict)

    async def insert_one(self, diagram: Diagram) -> str:
        return await self.repository.insert_one(diagram)

    async def find_by_project_api_version(self, project_id: str, api_id: str, version: int) -> Optional[Diagram]:
        """
        프로젝트 ID, API ID, 버전 ID로 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version: 버전

        Returns:
            Optional[Diagram]: 조회된 다이어그램 또는 None
        """
        filter_dict = {
            "projectId": project_id,
            "apiId": api_id,
            "metadata.version": version
        }

        return await self.repository.find_one(filter_dict)

    async def find_latest_by_project_api(self, project_id: str, api_id: str) -> Optional[Diagram]:
        """
        프로젝트 ID와 API ID로 최신 버전의 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            Optional[Diagram]: 최신 버전의 다이어그램 또는 None
        """
        filter_dict = {
            "projectId": project_id,
            "apiId": api_id
        }

        # 버전 번호를 기준으로 내림차순 정렬하여 최신 버전 조회
        sort = [("metadata.version", -1)]

        return await self.repository.find_one(filter_dict, sort)

    async def save(self, diagram: Diagram) -> Diagram:
        """
        다이어그램을 저장합니다. 기존 다이어그램이 있으면 업데이트하고, 없으면 새로 생성합니다.

        Args:
            diagram: 저장할 다이어그램 객체

        Returns:
            Diagram: 저장된 다이어그램 객체
        """
        # diagramId가 이미 존재하는지 확인
        existing_diagram = None
        if diagram.diagramId:
            existing_diagram = await self.repository.find_one({"diagramId": diagram.diagramId})

        if existing_diagram:
            # 기존 다이어그램이 있으면 업데이트
            filter_dict = {"diagramId": diagram.diagramId}
            update_dict = diagram.model_dump()

            # _id 필드 제거 (MongoDB가 관리)
            if "_id" in update_dict:
                del update_dict["_id"]

            await self.repository.update_one(filter_dict, {"$set": update_dict})
            return diagram
        else:
            # 새로운 다이어그램 생성
            if not diagram.diagramId:
                diagram.diagramId = str(uuid.uuid4())

            # 메타데이터 ID가 없으면 생성
            if not diagram.metadata.metadataId:
                diagram.metadata.metadataId = str(uuid.uuid4())

            # 최종 수정 일시 업데이트
            diagram.metadata.lastModified = datetime.utcnow()

            await self.repository.insert_one(diagram)
            return diagram

    async def update_component_position(self, project_id: str, api_id: str, component_id: str, x: float, y: float) -> \
    Optional[Diagram]:
        """
        특정 컴포넌트의 위치를 업데이트합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            component_id: 컴포넌트 ID
            x: 새로운 X 좌표
            y: 새로운 Y 좌표

        Returns:
            Optional[Diagram]: 업데이트된 다이어그램 또는 None
        """
        # 최신 다이어그램 조회
        diagram = await self.find_latest_by_project_api(project_id, api_id)
        if not diagram:
            return None

        # 해당 컴포넌트 찾기
        component_found = False
        for component in diagram.components:
            if component.componentId == component_id:
                component.positionX = x
                component.positionY = y
                component_found = True
                break

        if not component_found:
            return None

        # 최종 수정 시간 업데이트
        diagram.metadata.lastModified = datetime.utcnow()

        # 업데이트된 다이어그램 저장
        await self.save(diagram)
        return diagram

    async def create_new_version(self, diagram: Diagram) -> Diagram:
        """
        기존 다이어그램을 기반으로 새 버전의 다이어그램을 생성합니다.

        Args:
            diagram: 기존 다이어그램 객체

        Returns:
            Diagram: 새 버전으로 생성된 다이어그램 객체
        """
        # 새 다이어그램 생성 (기존 다이어그램 복제)
        new_diagram = Diagram(**diagram.model_dump())

        # 새 ID 부여
        new_diagram.diagramId = str(uuid.uuid4())

        # 메타데이터 업데이트
        new_diagram.metadata.metadataId = str(uuid.uuid4())
        new_diagram.metadata.version = diagram.metadata.version + 1
        new_diagram.metadata.lastModified = datetime.utcnow()

        # 새 다이어그램 저장
        await self.repository.insert_one(new_diagram)
        return new_diagram
