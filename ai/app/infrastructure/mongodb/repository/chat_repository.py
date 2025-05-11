from abc import ABCMeta, abstractmethod
from typing import List

from app.infrastructure.mongodb.repository.model.diagram_model import Chat
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository


class ChatRepository(MongoRepository[Chat], metaclass=ABCMeta):
    """
    Chat 문서를 MongoDB에서 관리하는 저장소 인터페이스
    """

    @abstractmethod
    async def get_prompts(self, project_id: str, api_id: str) -> List[Chat]:
        """
        특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            List[Chat]: 채팅 기록 목록
        """
        pass
