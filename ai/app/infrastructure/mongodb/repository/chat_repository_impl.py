import logging

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
        DiagramRepositoryImpl 초기화
        """
        super().__init__("chats", Chat)
        logging.info("ChatRepositoryImpl 주입")
        self.chat_collection_name = "chats"