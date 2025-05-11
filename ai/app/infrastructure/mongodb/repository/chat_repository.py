from abc import ABCMeta

from app.infrastructure.mongodb.repository.model.diagram_model import Chat
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository


class ChatRepository(MongoRepository[Chat], metaclass=ABCMeta):
    """
    Chat 문서를 MongoDB에서 관리하는 저장소 인터페이스
    """