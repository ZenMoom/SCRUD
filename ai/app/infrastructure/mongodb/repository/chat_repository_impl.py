import logging
from typing import List

from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Chat
from app.infrastructure.mongodb.repository.mongo_repository_impl import MongoRepositoryImpl

# 로깅 설정
logger = logging.getLogger(__name__)


class ChatRepositoryImpl(MongoRepositoryImpl[Chat], ChatRepository):
    """
    Chat 문서를 MongoDB에서 관리하는 저장소 구현 클래스
    """

    def __init__(self):
        """
        ChatRepositoryImpl 초기화
        """
        super().__init__("chats", Chat)
        logging.info("ChatRepositoryImpl 주입")
        self.chat_collection_name = "chats"

    async def get_prompts(self, project_id: str, api_id: str) -> List[Chat]:
        """
        특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            List[Chat]: 채팅 기록 목록
        """
        logger.info(f"프로젝트 ID {project_id}와 API ID {api_id}에 대한 채팅 기록 조회 중")

        # 프로젝트 ID와 API ID로 필터링
        filter_dict = {
            "projectId": project_id,
            "apiId": api_id
        }

        # 생성 시간 기준으로 정렬 (최신순)
        sort = [("createdAt", -1)]

        # 채팅 기록 조회
        chats = await self.find_many(filter_dict, sort)
        logger.info(f"{len(chats)}개의 채팅 기록을 조회했습니다")

        return chats