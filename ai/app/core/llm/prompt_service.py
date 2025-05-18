import asyncio
import logging
from typing import List

from app.api.dto.diagram_dto import UserChatRequest
from app.core.generator.streaming_handler import SSEStreamingHandler
from app.core.llm.chains.create_diagram_component_chain import CreateDiagramComponentChain
from app.core.llm.chains.user_chat_chain import UserChatChain
from app.core.models.diagram_model import DiagramChainPayload, ComponentChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload
from app.core.models.user_chat_model import UserChatChainPayload, SystemChatChainPayload
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram

logger = logging.getLogger(__name__)


class PromptService:
    def __init__(
            self,
            user_chat_chain: UserChatChain,
            create_diagram_chain: CreateDiagramComponentChain,
    ):
        self.user_chat_chain = user_chat_chain
        self.create_diagram_chain = create_diagram_chain

    def set_streaming_handler(self, queue: asyncio.Queue):
        """스트리밍 핸들러를 설정합니다"""
        streaming_handler = SSEStreamingHandler(response_queue=queue)
        self.user_chat_chain.llm.callbacks = [streaming_handler]

    async def process_api_spec_flow(
            self,
            api_spec: ApiSpec,
            global_files: GlobalFileList,
    ) -> List[ComponentChainPayload]:
        """API 스펙 기반 흐름 처리

        Args:
            api_spec: API 스펙 데이터
            global_files: 전역 데이터

        Returns:
            처리 결과
        """
        logger.info("Processing API spec flow")

        return await self.create_diagram_chain.predict(
            api_spec=api_spec,
            global_files=global_files,
        )

    async def process_chat_flow(
            self,
            chat_data: UserChatRequest,
            global_files: GlobalFileList,
            diagram: Diagram,
    ) -> SystemChatChainPayload:
        """채팅 기반 흐름 처리

        Args:
            chat_data: 채팅 데이터
            global_files: 전역 데이터
            diagram

        Returns:
            처리 결과
        """
        logger.info("LLM을 사용한 채팅 기반 프롬프트 처리 시작")

        # LLM 체인을 사용하여 처리
        result: SystemChatChainPayload = await self.user_chat_chain.predict(
            chat_data=convert_chat_payload(
                user_chat=chat_data,
                diagram=diagram,
                chat_data=chat_data
            ),
            global_files=GlobalFileListChainPayload.model_validate(global_files),
            current_diagram=DiagramChainPayload.model_validate(diagram),
        )

        logger.info("채팅 기반 프롬프트 처리 완료")

        return result


def convert_chat_payload(
        user_chat: UserChatRequest,
        diagram: Diagram,
        chat_data: UserChatRequest
) -> UserChatChainPayload:
    def get_code_data(latest_diagram: Diagram, user_chat_data: UserChatRequest) -> List:
        """메소드 ID 목록으로 코드 데이터 조회

        Args:
            latest_diagram: 메소드 ID 목록
            user_chat_data
        Returns:
            코드 데이터
        """
        logger.info(f"코드 데이터 조회: {user_chat_data.targetMethods}")

        from app.infrastructure.mongodb.repository.model.diagram_model import Method
        target_method_details: List[Method] = []
        latest_diagram_components = latest_diagram.components

        for component in latest_diagram_components:
            for targetMethod in user_chat_data.targetMethods:
                target_method_id = targetMethod.get("methodId", "")
                if not target_method_id:
                    continue

                for method in component.methods:
                    if method.methodId == target_method_id:
                        target_method_details.append(method)
                        break

        logger.info(f"코드 데이터 조회 완료: {len(target_method_details)}개 메소드")

        return [method.model_dump() for method in target_method_details]

    return UserChatChainPayload(
        tag=user_chat.tag.value,
        promptType=user_chat.promptType.value,
        message=user_chat.message,
        targetMethods=get_code_data(diagram, chat_data)
    )
