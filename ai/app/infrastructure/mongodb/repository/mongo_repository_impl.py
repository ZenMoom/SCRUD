from typing import Dict, List, Any, Optional, Type

from bson import ObjectId
from pymongo.collection import Collection

from app.infrastructure.mongodb.connection.connection import MongoDBConnection
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository, T


class MongoRepositoryImpl(MongoRepository[T]):
    """MongoDB 저장소의 구현 클래스"""

    def __init__(self, collection_name: str, model_class: Type[T]):
        """
        MongoDB 저장소 구현 클래스 초기화
        
        Args:
            collection_name: 컬렉션 이름
            model_class: 문서 매핑될 모델 클래스 타입
        """
        self.collection_name = collection_name
        self.model_class = model_class
        self._collection = None

    async def get_collection(self) -> Collection:
        """MongoDB 컬렉션 객체 반환"""
        if self._collection is None:
            db = await MongoDBConnection.connect()
            self._collection = db[self.collection_name]
        return self._collection

    async def find_one(self, filter_dict: Dict[str, Any]) -> Optional[T]:
        """
        조건에 맞는 단일 문서를 조회합니다.

        Args:
            filter_dict: 조회 필터 딕셔너리

        Returns:
            조회된 문서 또는 없을 경우 None
        """
        collection = await self.get_collection()
        document = await collection.find_one(filter_dict)
        
        if document is None:
            return None
            
        # _id를 문자열로 변환
        if '_id' in document and isinstance(document['_id'], ObjectId):
            document['_id'] = str(document['_id'])
            
        return self.model_class(**document)

    async def find_many(self, filter_dict: Dict[str, Any]) -> List[T]:
        """
        조건에 맞는 여러 문서를 조회합니다.

        Args:
            filter_dict: 조회 필터 딕셔너리

        Returns:
            조회된 문서 리스트
        """
        collection = await self.get_collection()
        documents = await collection.find(filter_dict).to_list(length=None)
        
        result = []
        for document in documents:
            # _id를 문자열로 변환
            if '_id' in document and isinstance(document['_id'], ObjectId):
                document['_id'] = str(document['_id'])
                
            result.append(self.model_class(**document))
            
        return result

    async def insert_one(self, document: T) -> str:
        """
        단일 문서를 삽입합니다.

        Args:
            document: 삽입할 문서

        Returns:
            삽입된 문서의 ID
        """
        collection = await self.get_collection()
        document_dict = document.model_dump()
        
        # _id가 있고 문자열이면 ObjectId로 변환
        if '_id' in document_dict and isinstance(document_dict['_id'], str):
            try:
                document_dict['_id'] = ObjectId(document_dict['_id'])
            except:
                # 유효한 ObjectId가 아니면 자동 생성되도록 삭제
                del document_dict['_id']
        
        result = await collection.insert_one(document_dict)
        return str(result.inserted_id)

    async def insert_many(self, documents: List[T]) -> List[str]:
        """
        여러 문서를 삽입합니다.

        Args:
            documents: 삽입할 문서 리스트

        Returns:
            삽입된 문서들의 ID 리스트
        """
        collection = await self.get_collection()
        documents_dict = [doc.model_dump() for doc in documents]
        
        # 각 문서의 _id 처리
        for document_dict in documents_dict:
            if '_id' in document_dict and isinstance(document_dict['_id'], str):
                try:
                    document_dict['_id'] = ObjectId(document_dict['_id'])
                except:
                    # 유효한 ObjectId가 아니면 자동 생성되도록 삭제
                    del document_dict['_id']
        
        result = await collection.insert_many(documents_dict)
        return [str(id) for id in result.inserted_ids]

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]) -> bool:
        """
        조건에 맞는 단일 문서를 업데이트합니다.

        Args:
            filter_dict: 업데이트할 문서 조회 필터
            update_dict: 업데이트 내용

        Returns:
            업데이트 성공 여부
        """
        collection = await self.get_collection()
        
        # _id가 문자열이면 ObjectId로 변환
        if '_id' in filter_dict and isinstance(filter_dict['_id'], str):
            filter_dict['_id'] = ObjectId(filter_dict['_id'])
        
        # 업데이트를 위해 $set 연산자 사용
        if '$set' not in update_dict:
            update_dict = {'$set': update_dict}
            
        result = await collection.update_one(filter_dict, update_dict)
        return result.modified_count > 0

    async def delete_one(self, filter_dict: Dict[str, Any]) -> bool:
        """
        조건에 맞는 단일 문서를 삭제합니다.

        Args:
            filter_dict: 삭제할 문서 조회 필터

        Returns:
            삭제 성공 여부
        """
        collection = await self.get_collection()
        
        # _id가 문자열이면 ObjectId로 변환
        if '_id' in filter_dict and isinstance(filter_dict['_id'], str):
            filter_dict['_id'] = ObjectId(filter_dict['_id'])
            
        result = await collection.delete_one(filter_dict)
        return result.deleted_count > 0