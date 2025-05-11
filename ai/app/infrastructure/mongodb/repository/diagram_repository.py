from typing import Dict, List, Any, Optional, Type
import uuid
from datetime import datetime

from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, Component, Metadata


class DiagramRepository(MongoRepository[Diagram]):
    """
    Diagram 문서를 MongoDB에서 관리하는 저장소 인터페이스
    """
    
    async def get_diagram_by_version(self, project_id: str, api_id: str, version_id: str) -> Optional[Diagram]:
        """
        특정 프로젝트와 API의 특정 버전 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version_id: 버전 ID

        Returns:
            찾은 Diagram 객체 또는 None
        """
        pass
    
    async def update_component_position(self, project_id: str, api_id: str, component_id: str, 
                                    position_x: float, position_y: float) -> Optional[Component]:
        """
        다이어그램에서 특정 컴포넌트의 위치를 업데이트합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            component_id: 컴포넌트 ID
            position_x: 새 X 좌표
            position_y: 새 Y 좌표

        Returns:
            업데이트된 Component 객체 또는 None
        """
        pass
    
    async def create_chat_and_diagram(self, project_id: str, api_id: str, user_chat: Dict[str, Any], 
                                  system_chat: Dict[str, Any], diagram: Diagram) -> str:
        """
        채팅 요청 및 응답과 함께 새 버전의 다이어그램을 생성하고 저장합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat: 사용자 채팅 데이터
            system_chat: 시스템 채팅 응답 데이터
            diagram: 새로 생성된 다이어그램 데이터

        Returns:
            생성된 채팅 ID
        """
        pass