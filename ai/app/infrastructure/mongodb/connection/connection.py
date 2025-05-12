"""MongoDB 연결 관리 모듈"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

from app.config.config import settings

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """MongoDB 연결 관리 클래스

    단일 책임: MongoDB 서버 연결 관리
    """
    _client = None
    _db = None

    @classmethod
    async def connect(cls):
        """MongoDB 서버에 연결"""
        if cls._client is None:
            try:
                # 환경 변수에서 MongoDB URI 가져오기
                mongo_uri = settings.MONGO_URI
                db_name = settings.MONGO_DB_NAME

                # MongoDB 클라이언트 생성 (비동기)
                cls._client = AsyncIOMotorClient(mongo_uri)
                cls._db = cls._client[db_name]

                # 연결 상태 검증
                print(f"MongoDB에 연결합니다: {mongo_uri}, 데이터베이스: {db_name}")

                await cls._client.admin.command('ping')
                logger.info(f"MongoDB 연결 성공: {mongo_uri}, 데이터베이스: {db_name}")

                return cls._db
            except ConnectionFailure as e:
                logger.error(f"MongoDB 연결 실패: {e}")
                raise
            except Exception as e:
                logger.error(f"MongoDB 연결 중 예기치 않은 오류: {e}")
                raise
        return cls._db

    @classmethod
    async def close(cls):
        """MongoDB 연결 종료"""
        if cls._client is not None:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB 연결 종료")

    @classmethod
    def get_database(cls):
        """데이터베이스 인스턴스 반환"""
        if cls._db is None:
            raise ConnectionError("MongoDB에 연결되어 있지 않습니다. connect() 메서드를 먼저 호출하세요.")
        return cls._db


async def get_database():
    """애플리케이션에서 데이터베이스 인스턴스를 가져오는 유틸리티 함수"""
    return await MongoDBConnection.connect()
