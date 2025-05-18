import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel

from app.core.llm.prompts.dto_prompts import get_dto_prompt
from app.core.models.diagram_model import DtoModelChainPayload
from app.core.models.global_setting_model import ApiSpecChainPayload

logger = logging.getLogger(__name__)

class DtoModelChainList(BaseModel):
    dto: List[DtoModelChainPayload]

class DtoModelChain:
    """DTO 데이터 획득 체인"""

    def __init__(self, llm: BaseChatModel):
        """DTO 데이터 획득 체인 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm

        # LCEL을 사용한 체인 구성
        self.chain = (
            {
                "api_spec": RunnablePassthrough(),
                "output_instructions": RunnablePassthrough(),
            }
            | get_dto_prompt()
            | llm
            | PydanticOutputParser(pydantic_object=DtoModelChainList)
        )

        logger.info("DTO 데이터 획득 체인 초기화됨")

    async def predict(self, api_spec: ApiSpecChainPayload) -> List[DtoModelChainPayload]:
        """DTO 기반으로 다이어그램 필요 여부 예측

        Args:
            chat_data: 채팅 데이터
            api_spec
        """
        logger.info(f"채팅 데이터: {api_spec}")
        result: DtoModelChainList = await self.chain.ainvoke({
            "api_spec" : api_spec,
            "output_instructions" : PydanticOutputParser(pydantic_object=DtoModelChainList).get_format_instructions(),
        })

        return result.dto