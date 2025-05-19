import logging
from typing import List

from app.core.llm.chains.component_chain import ComponentChain
from app.core.llm.chains.dto_chain import DtoModelChain
from app.core.models.diagram_model import DtoModelChainPayload, ComponentChainPayload, DiagramChainPayload
from app.core.models.global_setting_model import ApiSpecChainPayload
from app.core.models.user_chat_model import SystemChatChainPayload
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram

logger = logging.getLogger(__name__)


class ComponentService:

    def __init__(
            self,
            component_chain: ComponentChain,
            dto_chain: DtoModelChain,
    ):
        self.component_chain = component_chain
        self.dto_chain = dto_chain

    async def create_components_with_system_chat(
            self,
            system_chat: SystemChatChainPayload,
            diagram: Diagram
    ) -> List[ComponentChainPayload]:
        """프롬프트 결과로부터 컴포넌트 목록 생성

        Args:
            system_chat
            diagram: 프롬프트 처리 결과

        Returns:
            생성된 컴포넌트 목록
        """

        logger.info("Creating components from prompt result")

        return await self.component_chain.predict(
            chat_data=system_chat,
            diagram=DiagramChainPayload.model_validate(diagram)
        )

    async def create_dtos_with_api_spec(
            self,
            api_spec: ApiSpecChainPayload,
            components: List[ComponentChainPayload]
    ) -> List[DtoModelChainPayload]:
        """프롬프트 결과로부터 DTO 목록 생성

        Args:
            components: 프롬프트 처리 결과
            api_spec
        Returns:
            생성된 DTO 목록
        """
        logger.info("Creating DTOs from prompt result")

        return await self.dto_chain.predict(
            api_spec=api_spec,
            components=components
        )

