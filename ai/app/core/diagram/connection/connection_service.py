import logging
from typing import List

from app.core.llm.chains.connection_chain import ConnectionChain
from app.core.models.diagram_model import ComponentChainPayload, ConnectionChainPayload

logger = logging.getLogger(__name__)


class ConnectionService:

    def __init__(
            self,
            connection_chain: ConnectionChain,
    ):
        self.connection_chain = connection_chain

    async def _process_connection_flow(
            self,
            components: List[ComponentChainPayload],
    ) -> List[ConnectionChainPayload]:
        return await self.connection_chain.predict(components)

    async def create_connection_with_prompt(self, components: List[ComponentChainPayload]) -> List[ConnectionChainPayload]:
        """프롬프트 결과로부터 DTO 목록 생성

        Args:
            result: 프롬프트 처리 결과
            components
        Returns:
            생성된 DTO 목록
        """
        logger.info("Creating DTOs from prompt result")
        return await self._process_connection_flow(
            components=components
        )

