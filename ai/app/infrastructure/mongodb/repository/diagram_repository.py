from abc import ABC, abstractmethod
from typing import Optional, List

from app.infrastructure.mongodb.repository.model.diagram_model import Diagram


class DiagramRepository(ABC):
    """
    다이어그램 데이터에 대한 데이터베이스 액세스를 추상화하는 인터페이스
    """

    @abstractmethod
    async def find_by_project_api_version(self, project_id: str, api_id: str, version_id: int) -> Optional[Diagram]:
        """
        프로젝트 ID, API ID, 버전 ID로 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version_id: 버전 ID

        Returns:
            Optional[Diagram]: 조회된 다이어그램 또는 None
        """
        pass

    @abstractmethod
    async def find_latest_by_project_api(self, project_id: str, api_id: str) -> Optional[Diagram]:
        """
        프로젝트 ID와 API ID로 최신 버전의 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            Optional[Diagram]: 최신 버전의 다이어그램 또는 None
        """
        pass

    @abstractmethod
    async def save(self, diagram: Diagram) -> Diagram:
        """
        다이어그램을 저장합니다. 기존 다이어그램이 있으면 업데이트하고, 없으면 새로 생성합니다.

        Args:
            diagram: 저장할 다이어그램 객체

        Returns:
            Diagram: 저장된 다이어그램 객체
        """
        pass

    @abstractmethod
    async def update_component_position(self, project_id: str, api_id: str, component_id: str, x: float, y: float) -> Optional[Diagram]:
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
        pass

    @abstractmethod
    async def create_new_version(self, diagram: Diagram) -> Diagram:
        """
        기존 다이어그램을 기반으로 새 버전의 다이어그램을 생성합니다.

        Args:
            diagram: 기존 다이어그램 객체

        Returns:
            Diagram: 새 버전으로 생성된 다이어그램 객체
        """
        pass