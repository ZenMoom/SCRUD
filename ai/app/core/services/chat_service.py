import logging
import uuid
from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException

from app.api.dto.diagram_dto import UserChatRequest, ChatResponse, ChatResponseList
from app.core.llm.chains.chat_summary_chain import ChatSummaryChain
from app.core.models.user_chat_model import SystemChatChainPayload
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, SystemChat, Chat, VersionInfo, UserChat


class ChatService:
    """
    OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 서비스
    """

    def __init__(
            self,
            diagram_repository: Optional[DiagramRepository] = None,
            chat_repository: Optional[ChatRepository] = None,
            chat_summary_chain: ChatSummaryChain = None,
    ):
        """
        ChatService 초기화

        Args:
            diagram_repository (DiagramRepository, optional): 다이어그램 저장소
            chat_repository (ChatRepository, optional): 채팅 저장소
        """
        self.diagram_repository = diagram_repository
        self.chat_repository = chat_repository
        self.chat_summary_chain = chat_summary_chain

        self.llm = None
        self.parser = None
        self.agent_executor = None
        self.logger = logging.getLogger(__name__)

    async def get_target_diagram(
            self,
            project_id: str,
            api_id: str,
            user_chat_data: UserChatRequest,
    ) -> Diagram:
        """최신 다이어그램을 조회하는 함수"""

        def _has_target_methods() -> bool:
            """타겟 메서드가 있는지 확인하는 함수"""
            return user_chat_data.targetMethods and len(user_chat_data.targetMethods) > 0

        async def _find_diagram_by_method_id() -> Diagram | None:
            """메서드 ID로 다이어그램을 조회하는 함수"""
            self.logger.info(f"methodId로 다이어그램 조회: methodId={method_id}")

            # MongoDB 쿼리를 사용해 methodId가 포함된 다이어그램 조회
            diagram_with_method = await self.diagram_repository.find_diagram_by_method_id(
                project_id=project_id,
                api_id=api_id,
                method_id=method_id
            )

            if diagram_with_method:
                self.logger.info(f"methodId={method_id}로 다이어그램을 찾았습니다. version={diagram_with_method.metadata.version}")
                return diagram_with_method

            # 다이어그램을 찾지 못한 경우 에러 처리
            raise HTTPException(status_code=404, detail=f"methodId={method_id}에 해당하는 다이어그램을 찾을 수 없습니다.")

        async def _find_latest_diagram() -> Diagram | None:
            """최신 다이어그램을 조회하는 함수"""
            latest_diagram = await self.diagram_repository.find_latest_by_project_api(project_id, api_id)

            if latest_diagram:
                return latest_diagram

            # 다이어그램을 찾지 못한 경우 에러 처리
            raise HTTPException(status_code=404, detail=f"다이어그램을 찾을 수 없습니다: project_id={project_id}, api_id={api_id}")

        self.logger.info(f"최신 다이어그램 조회: project_id={project_id}, api_id={api_id}")

        # 타겟 메서드가 있는 경우 처리
        if _has_target_methods():
            method_id = user_chat_data.targetMethods[0].get("methodId", "")
            if method_id:
                return await _find_diagram_by_method_id()

        # 최신 다이어그램 조회
        return await _find_latest_diagram()

    async def get_prompts(self, project_id: str, api_id: str) -> ChatResponseList:
        """
        특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            ChatResponseList: 채팅 기록 목록
        """
        try:
            self.logger.info(f"채팅 기록 조회 시작: project_id={project_id}, api_id={api_id}")

            # 채팅 저장소를 통해 채팅 기록 조회
            chats = await self.chat_repository.get_prompts(project_id, api_id)
            self.logger.info(f"{len(chats)}개의 채팅 기록을 조회했습니다")

            # 조회된 채팅을 DTO로 변환
            chat_responses = []
            for chat in chats:
                # Chat 모델을 ChatResponse DTO로 변환
                chat_response = ChatResponse(
                    chatId=chat.chatId,
                    createdAt=chat.createdAt,
                    userChat=ChatResponse.UserChatResponse(**chat.userChat.model_dump()) if chat.userChat else None,
                    systemChat=ChatResponse.SystemChatResponse(
                        **chat.systemChat.model_dump()) if chat.systemChat else None
                )
                chat_responses.append(chat_response)

            # ChatResponseList로 래핑하여 반환
            response = ChatResponseList(content=chat_responses)
            self.logger.info(f"채팅 기록 조회 완료: {len(response.content)}개의 채팅")

            return response

        except Exception as e:
            self.logger.error(f"채팅 기록 조회 중 오류 발생: {str(e)}", exc_info=True)
            raise

    ######################################################################################################

    async def create_short_summary(
            self,
            system_chat: SystemChatChainPayload,
    ) -> Tuple[str, str]:
        return await self.chat_summary_chain.predict(
            system_chat=system_chat
        )

    """채팅 생성 관련 핵심 로직을 메서드로 분리"""

    def assemble_chat_entity(
            self,
            project_id: str,
            api_id: str,
            chat_request: UserChatRequest,
            version_info: VersionInfo,
            diagram_id: str,
            system_chat_payload: SystemChatChainPayload,
    ) -> Chat:
        system_chat = SystemChat.model_validate({
            **system_chat_payload.model_dump(),
            "diagramId": diagram_id,
            "systemChatId": str(uuid.uuid4()),
            "versionInfo": version_info.model_dump(),
        })

        user_chat = UserChat(
            tag=chat_request.tag,
            promptType=chat_request.promptType,
            message=chat_request.message,
            targetMethods=chat_request.targetMethods
        )

        # Chat 엔티티 최종 조립
        return Chat(
            chatId=str(uuid.uuid4()),
            projectId=project_id,
            apiId=api_id,
            userChat=user_chat,
            systemChat=system_chat,
            createdAt=datetime.now()
        )

    async def save_chat(self, chat: Chat) -> str:
        return await self.chat_repository.insert_one(chat)
