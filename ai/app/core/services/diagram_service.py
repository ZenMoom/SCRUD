import logging
from typing import Protocol

from app.infrastructure.kafka.dto.user_chat_dto import UserChatRequest
from app.infrastructure.kafka.dto.system_chat_dto import SystemChatResponse, PromptResponseEnum, VersionInfo


class Repository(Protocol):
    async def insert_one(self, data) -> str:
        ...


class DiagramService:
    """
    다이어그램 생성 및 관리를 위한 서비스 클래스
    """
    def __init__(self, repository: Repository, logger=None):
        self.repository = repository
        self.logger = logger or logging.getLogger(__name__)

    async def create_diagram(self, message: UserChatRequest) -> SystemChatResponse:
        """
        다이어그램 생성 로직
        """
        # TODO: 여기에 다이어그램을 생성하는 로직이 추가되어야함
        self.logger.info("다이어그램을 생성합니다.")
        self.logger.info("다이어그램을 생성합니다. - 10%")
        self.logger.info("다이어그램을 생성합니다. - 30%")
        self.logger.info("다이어그램을 생성합니다. - 50%")
        self.logger.info("다이어그램을 생성합니다. - 70%")
        self.logger.info("다이어그램을 생성합니다. - 100%")

        # 생성된 채팅 응답을 다시 스프링으로 보내기
        # 모든 필드 사용
        response: SystemChatResponse = SystemChatResponse(
            systemChatId="chat-12345",
            status=PromptResponseEnum.MODIFIED,
            systemChatMessage="메서드 구현이 완료되었습니다. 클래스 구조를 개선하고 중복 코드를 제거했습니다.",
            versionInfo=VersionInfo(
                newVersionId="v1.2.3",
                description="인증 시스템 리팩토링 및 기능 개선"
            ),
            diagramId="diagram-001"
        )

        inserted_id = await self.repository.insert_one(response)
        self.logger.info(f"저장된 값 {inserted_id}")

        return response


# 하위 호환성을 위한 함수 (기존 코드를 사용하는 다른 모듈을 위해)
from app.infrastructure.mongodb.repository.mongo_mock_repository import MongoMockRepository

# 싱글톤 인스턴스 생성 (기존 코드와의 호환성을 위해)
_diagram_service = DiagramService(
    repository=MongoMockRepository(SystemChatResponse),
    logger=logging.getLogger(__name__)
)

# 기존 함수를 새 클래스의 메서드로 위임
async def create_diagram(message: UserChatRequest) -> SystemChatResponse:
    return await _diagram_service.create_diagram(message)