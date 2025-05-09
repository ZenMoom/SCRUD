import copy
import uuid
from typing import Dict, List, Any, Optional, TypeVar, Type, Generic
from pydantic import BaseModel
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository

T = TypeVar('T', bound=BaseModel)

class MongoMockRepository(MongoRepository[T]):
    """MongoDB 저장소의 인메모리 목 구현"""

    def __init__(self, model_class: Optional[Type[T]] = None):
        """
        인메모리 저장소를 초기화합니다.

        Args:
            model_class: 저장소에서 사용할 모델 클래스
        """
        self.model_class = model_class
        self.collection: Dict[str, Dict[str, Any]] = {}  # 인메모리 컬렉션
        self.stored_data = None  # 마지막으로 저장된 데이터를 추적하기 위한 속성

    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[T]:
        """조건에 맞는 첫 번째 문서를 조회합니다."""
        for doc_id, doc in self.collection.items():
            match = True
            for key, value in filter_dict.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                if self.model_class:
                    return self.model_class.model_validate(copy.deepcopy(doc))
                return copy.deepcopy(doc)
        return None

    async def find_many(self, filter_dict: Dict[str, Any]) -> List[T]:
        """조건에 맞는 모든 문서를 조회합니다."""
        results = []
        for doc_id, doc in self.collection.items():
            match = True
            for key, value in filter_dict.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                if self.model_class:
                    results.append(self.model_class.model_validate(copy.deepcopy(doc)))
                else:
                    results.append(copy.deepcopy(doc))
        return results

    async def insert_one(self, document: T) -> str:
        """단일 문서를 삽입합니다."""
        doc_dict = document.model_dump() if hasattr(document, 'model_dump') else document

        # _id가 없으면 생성
        if '_id' not in doc_dict:
            doc_dict['_id'] = str(uuid.uuid4())

        doc_id = doc_dict['_id']
        self.collection[doc_id] = doc_dict
        self.stored_data = document  # 테스트를 위해 마지막으로 저장된 데이터 추적
        return doc_id

    def insert_one(self, document: Any) -> str:
        """동기 버전: 단일 문서를 삽입합니다."""
        doc_dict = document.model_dump() if hasattr(document, 'model_dump') else document

        # _id가 없으면 생성
        if '_id' not in doc_dict:
            doc_dict['_id'] = str(uuid.uuid4())

        doc_id = doc_dict['_id']
        self.collection[doc_id] = doc_dict
        self.stored_data = document  # 테스트를 위해 마지막으로 저장된 데이터 추적
        return doc_id

    async def insert_many(self, documents: List[T]) -> List[str]:
        """여러 문서를 삽입합니다."""
        ids = []
        for doc in documents:
            doc_id = await self.insert_one(doc)
            ids.append(doc_id)
        return ids

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]) -> bool:
        """조건에 맞는 첫 번째 문서를 업데이트합니다."""
        for doc_id, doc in self.collection.items():
            match = True
            for key, value in filter_dict.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                # MongoDB의 $set 연산자 시뮬레이션
                if '$set' in update_dict:
                    for key, value in update_dict['$set'].items():
                        doc[key] = value
                else:
                    # 직접 필드 업데이트
                    for key, value in update_dict.items():
                        doc[key] = value
                return True
        return False

    async def delete_one(self, filter_dict: Dict[str, Any]) -> bool:
        """조건에 맞는 첫 번째 문서를 삭제합니다."""
        for doc_id, doc in self.collection.items():
            match = True
            for key, value in filter_dict.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                del self.collection[doc_id]
                return True
        return False