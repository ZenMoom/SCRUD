from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, TypeVar, Generic

from pydantic import BaseModel

# 제네릭 타입 정의 (모든 모델 타입에 사용 가능)
T = TypeVar('T', bound=BaseModel)


class MongoRepository(Generic[T], ABC):
    """MongoDB 저장소의 인터페이스 클래스"""

    @abstractmethod
    async def find_one(self, filter_dict: Dict[str, Any], sort: List[tuple] = None) -> Optional[T]:
        """
        조건에 맞는 단일 문서를 조회합니다.

        Args:
            filter_dict: 조회 필터 딕셔너리
            sort: 정렬 조건 (예: [("field", 1)]) 1은 오름차순, -1은 내림차순

        Returns:
            조회된 문서 또는 없을 경우 None
        """
        pass

    @abstractmethod
    async def find_many(self, filter_dict: Dict[str, Any], sort: List[tuple] = None) -> List[T]:
        """
        조건에 맞는 여러 문서를 조회합니다.

        Args:
            filter_dict: 조회 필터 딕셔너리
            sort: 정렬 조건 (예: [("field", 1)]) 1은 오름차순, -1은 내림차순

        Returns:
            조회된 문서 리스트
        """
        pass

    @abstractmethod
    async def insert_one(self, document: T) -> str:
        """
        단일 문서를 삽입합니다.

        Args:
            document: 삽입할 문서

        Returns:
            삽입된 문서의 ID
        """
        pass

    @abstractmethod
    async def insert_many(self, documents: List[T]) -> List[str]:
        """
        여러 문서를 삽입합니다.

        Args:
            documents: 삽입할 문서 리스트

        Returns:
            삽입된 문서들의 ID 리스트
        """
        pass

    @abstractmethod
    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]) -> bool:
        """
        조건에 맞는 단일 문서를 업데이트합니다.

        Args:
            filter_dict: 업데이트할 문서 조회 필터
            update_dict: 업데이트 내용

        Returns:
            업데이트 성공 여부
        """
        pass

    @abstractmethod
    async def delete_one(self, filter_dict: Dict[str, Any]) -> bool:
        """
        조건에 맞는 단일 문서를 삭제합니다.

        Args:
            filter_dict: 삭제할 문서 조회 필터

        Returns:
            삭제 성공 여부
        """
        pass
