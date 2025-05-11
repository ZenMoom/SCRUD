import unittest
import logging
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.dto.diagram_dto import ChatResponse, ChatResponseList
from app.core.generator.model_generator import ModelGenerator
from app.core.services.chat_service import ChatService
from app.core.services.sse_service import SSEService
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Chat, UserChat, SystemChat


@pytest.mark.asyncio
class TestChatService:
    """
    ChatService 테스트 클래스
    """

    @pytest.fixture
    def setup_chat_service(self):
        """
        테스트를 위한 ChatService 설정
        """
        # Mock 객체 생성
        model_generator_mock = MagicMock(spec=ModelGenerator)
        diagram_repository_mock = AsyncMock(spec=DiagramRepository)
        chat_repository_mock = AsyncMock(spec=ChatRepository)
        sse_service_mock = MagicMock(spec=SSEService)
        logger_mock = MagicMock(spec=logging.Logger)

        # ChatService 인스턴스 생성
        chat_service = ChatService(
            model_name="test_model",
            model_generator=model_generator_mock,
            diagram_repository=diagram_repository_mock,
            chat_repository=chat_repository_mock,
            sse_service=sse_service_mock,
            logger=logger_mock
        )

        return (
            chat_service,
            model_generator_mock,
            diagram_repository_mock,
            chat_repository_mock,
            sse_service_mock,
            logger_mock
        )

    async def test_get_prompts_success(self, setup_chat_service):
        """
        get_prompts 메서드가 성공적으로 채팅 기록을 반환하는지 테스트
        """
        # 테스트 설정
        (
            chat_service,
            _,
            _,
            chat_repository_mock,
            _,
            _
        ) = setup_chat_service

        # 테스트 데이터 설정
        project_id = "test_project_id"
        api_id = "test_api_id"

        # 목업 데이터 생성
        test_chats = [
            Chat(
                id="chat_id_1",
                chatId="chat_1",
                createdAt=datetime.now(),
                userChat=UserChat(
                    id="user_chat_id_1",
                    tag="EXPLAIN",
                    promptType="SIGNATURE",
                    message="테스트 메시지 1",
                    targetMethods=[{"methodId": "method_1"}]
                ),
                systemChat=SystemChat(
                    id="system_chat_id_1",
                    systemChatId="sys_chat_1",
                    status="EXPLANATION",
                    message="시스템 응답 1",
                    diagramId="diagram_1"
                )
            ),
            Chat(
                id="chat_id_2",
                chatId="chat_2",
                createdAt=datetime.now(),
                userChat=UserChat(
                    id="user_chat_id_2",
                    tag="REFACTORING",
                    promptType="BODY",
                    message="테스트 메시지 2",
                    targetMethods=[{"methodId": "method_2"}]
                ),
                systemChat=SystemChat(
                    id="system_chat_id_2",
                    systemChatId="sys_chat_2",
                    status="MODIFIED",
                    message="시스템 응답 2",
                    diagramId="diagram_2"
                )
            )
        ]

        # chat_repository_mock 동작 설정
        chat_repository_mock.get_prompts.return_value = test_chats

        # 메서드 호출
        result = await chat_service.get_prompts(project_id, api_id)

        # 검증
        assert isinstance(result, ChatResponseList)
        assert len(result.content) == 2
        
        # 첫 번째 채팅 검증
        # assert result.content[0].id == "chat_id_1"
        assert result.content[0].chatId == "chat_1"
        assert result.content[0].userChat.tag == "EXPLAIN"
        assert result.content[0].userChat.promptType == "SIGNATURE"
        assert result.content[0].userChat.message == "테스트 메시지 1"
        assert result.content[0].systemChat.status == "EXPLANATION"
        assert result.content[0].systemChat.message == "시스템 응답 1"
        
        # 두 번째 채팅 검증
        # assert result.content[1].id == "chat_id_2"
        assert result.content[1].chatId == "chat_2"
        assert result.content[1].userChat.tag == "REFACTORING"
        assert result.content[1].userChat.promptType == "BODY"
        assert result.content[1].userChat.message == "테스트 메시지 2"
        assert result.content[1].systemChat.status == "MODIFIED"
        assert result.content[1].systemChat.message == "시스템 응답 2"
        
        # 메서드 호출 검증
        chat_repository_mock.get_prompts.assert_called_once_with(project_id, api_id)

    async def test_get_prompts_empty_result(self, setup_chat_service):
        """
        채팅 기록이 없는 경우 빈 목록을 반환하는지 테스트
        """
        # 테스트 설정
        (
            chat_service,
            _,
            _,
            chat_repository_mock,
            _,
            _
        ) = setup_chat_service

        # 테스트 데이터 설정
        project_id = "test_project_id"
        api_id = "test_api_id"

        # chat_repository_mock 동작 설정 - 빈 목록 반환
        chat_repository_mock.get_prompts.return_value = []

        # 메서드 호출
        result = await chat_service.get_prompts(project_id, api_id)

        # 검증
        assert isinstance(result, ChatResponseList)
        assert len(result.content) == 0
        
        # 메서드 호출 검증
        chat_repository_mock.get_prompts.assert_called_once_with(project_id, api_id)

    async def test_get_prompts_error_handling(self, setup_chat_service):
        """
        예외 발생 시 적절히 처리되는지 테스트
        """
        # 테스트 설정
        (
            chat_service,
            _,
            _,
            chat_repository_mock,
            _,
            logger_mock
        ) = setup_chat_service

        # 테스트 데이터 설정
        project_id = "test_project_id"
        api_id = "test_api_id"

        # chat_repository_mock 동작 설정 - 예외 발생
        test_exception = Exception("테스트 예외")
        chat_repository_mock.get_prompts.side_effect = test_exception

        # 메서드 호출 및 예외 확인
        with pytest.raises(Exception) as excinfo:
            await chat_service.get_prompts(project_id, api_id)
        
        assert str(excinfo.value) == "테스트 예외"
        
        # 로깅 확인
        logger_mock.error.assert_called_once()
        
        # 메서드 호출 검증
        chat_repository_mock.get_prompts.assert_called_once_with(project_id, api_id)