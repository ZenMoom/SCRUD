import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram
from app.infrastructure.mongodb.repository.mongo_repository_impl import MongoRepositoryImpl
import logging


class DiagramRepositoryImpl(DiagramRepository):
    """
    MongoDB를 사용한 다이어그램 저장소 구현
    """

    def __init__(self):
        """
        DiagramRepositoryImpl 초기화
        """
        self.repository = MongoRepositoryImpl("diagrams", Diagram)
        self.logger = logging.getLogger(__name__)

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
        프로젝트 ID와 API ID를 기준으로 가장 높은 버전 값에 1을 더한 버전으로 생성됩니다.

        Args:
            diagram: 기존 다이어그램 객체
        Returns:
            Diagram: 새 버전으로 생성된 다이어그램 객체
        """
        # 프로젝트 ID와 API ID로 모든 다이어그램 조회 (버전 내림차순)
        filter_dict = {
            "projectId": diagram.projectId,
            "apiId": diagram.apiId
        }
        sort = [("metadata.version", -1)]

        # 가장 최신 버전의 다이어그램 조회
        latest_diagram = await self.repository.find_one(filter_dict, sort)

        # 새 버전 번호 계산 (현재 최신 버전 + 1)
        new_version = latest_diagram.metadata.version + 1 if latest_diagram else 1

        # 새 다이어그램 생성 (기존 다이어그램 복제)
        new_diagram = Diagram(**diagram.model_dump())

        # 메타데이터 업데이트
        self.logger.info(f"버전 업데이트: {latest_diagram.metadata.version} -> {new_version}")

        new_diagram.metadata.metadataId = str(uuid.uuid4())
        new_diagram.metadata.version = new_version
        new_diagram.metadata.lastModified = datetime.utcnow()

        # 새 다이어그램 저장
        await self.repository.insert_one(new_diagram)
        return new_diagram

    async def find_diagram_by_method_id(self, project_id: str, api_id: str, method_id: str) -> Optional[Diagram]:
        """
        프로젝트 ID, API ID, 메서드 ID로 다이어그램을 조회합니다.
        MongoDB의 $elemMatch 쿼리 연산자를 사용하여 components 배열 내에서 
        methods 배열 내의 methodId 필드가 주어진 method_id와 일치하는 문서를 찾습니다.
        
        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            method_id: 메서드 ID
            
        Returns:
            Optional[Diagram]: 해당 메서드 ID를 포함하는 다이어그램 또는 None
        """
        # MongoDB 쿼리 작성 - components 배열 내의 메서드들 중 methodId가 일치하는 요소 검색
        filter_dict = {
            "projectId": project_id,
            "apiId": api_id,
            "components": {
                "$elemMatch": {
                    "methods": {
                        "$elemMatch": {
                            "methodId": method_id
                        }
                    }
                }
            }
        }
        
        # 버전 번호를 기준으로 내림차순 정렬하여 최신 버전을 먼저 찾음
        diagram: Diagram = await self.repository.find_one(filter_dict)
        self.logger.info(f"다이어그램 발견: {diagram.diagramId}")
        
        # 쿼리 실행 및 결과 반환
        return diagram
