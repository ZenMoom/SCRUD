import json
import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel

from app.core.llm.prompts.connection_prompts import get_connection_prompt
from app.core.models.diagram_model import ComponentChainPayload, ConnectionChainPayload

logger = logging.getLogger(__name__)

class ConnectionChainPayloadList(BaseModel):
    connections: List[ConnectionChainPayload]

class ConnectionChain:
    """다이어그램 필요 여부 판단 체인"""

    def __init__(self, llm: BaseChatModel):
        """다이어그램 필요 여부 판단 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm

        # LCEL을 사용한 체인 구성
        self.chain = (
                {
                    "connection_schema": RunnablePassthrough(),
                    "output_instructions": RunnablePassthrough(),
                }
                | get_connection_prompt()
                | self.llm
                | PydanticOutputParser(pydantic_object=ConnectionChainPayloadList)
        )

        logger.info("다이어그램 필요 여부 판단 체인 초기화됨")

    async def predict(self, component_payload_list: List[ComponentChainPayload]) -> List[ConnectionChainPayload]:
        """컴포넌트 데이터를 기반으로 다이어그램 필요 여부 예측

        Args:
            component_payload_list: 컴포넌트 데이터

        Returns:
            다이어그램 필요 여부
        """
        logger.info(f"[디버깅] ConnectionChain - predict 메소드 시작 - 컴포넌트 개수: {len(component_payload_list)}")

        component_data = json.dumps([p.model_dump() for p in component_payload_list], ensure_ascii=False)
        logger.info(f"컴포넌트 데이터: {component_data}")

        result: ConnectionChainPayloadList = await self.chain.ainvoke({
            "connection_schema": component_data,
            "output_instructions": PydanticOutputParser(pydantic_object=ConnectionChainPayloadList).get_format_instructions(),
        })
        logger.info(f"[디버깅] ConnectionChain - predict 메소드 결과 - 커넥션 개수: {len(result.connections)}")
        return result.connections