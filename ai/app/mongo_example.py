from pydantic import BaseModel
import asyncio
from typing import Optional
from app.infrastructure.mongodb.repository.mongo_repository_impl import MongoRepositoryImpl

# 예시 모델 클래스
class User(BaseModel):
    _id: Optional[str] = None
    username: str
    email: str
    age: int


async def main():
    # 저장소 초기화
    user_repo = MongoRepositoryImpl("scrud", User)
    # user_repo = MongoMockRepository(User)

    # 문서 삽입
    user1 = User(username="user1", email="user1@example.com", age=25)
    user_id = await user_repo.insert_one(user1)
    print(f"Inserted user with ID: {user_id}")

    # 문서 조회
    found_user = await user_repo.find_one({"username": "user1"})
    print(f"Found user: {found_user}")

    # 문서 업데이트
    updated = await user_repo.update_one(
        {"username": "user1"},
        {"$set": {"age": 26}}
    )
    print(f"Update successful: {updated}")

    # 업데이트 확인
    updated_user = await user_repo.find_one({"username": "user1"})
    print(f"Updated user: {updated_user}")

    # 문서 삭제
    deleted = await user_repo.delete_one({"username": "user1"})
    print(f"Delete successful: {deleted}")

    # 삭제 확인
    no_user = await user_repo.find_one({"username": "user1"})
    print(f"User after deletion: {no_user}")


if __name__ == "__main__":
    asyncio.run(main())