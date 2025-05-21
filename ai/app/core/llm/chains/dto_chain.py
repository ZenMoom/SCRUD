import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel

from app.core.llm.prompts.dto_prompts import get_dto_prompt
from app.core.models.diagram_model import DtoModelChainPayload, ComponentChainPayload
from app.core.models.global_setting_model import ApiSpecChainPayload
from app.utils.prompt_builder import PromptBuilder

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
        self.prompt: ChatPromptTemplate = get_dto_prompt()
        # LCEL을 사용한 체인 구성
        self.chain = (
              self.prompt
            | llm
            | PydanticOutputParser(pydantic_object=DtoModelChainList)
        )


    async def predict(
            self,
            api_spec: ApiSpecChainPayload,
            components: List[ComponentChainPayload]
    ) -> List[DtoModelChainPayload]:
        """DTO 기반으로 다이어그램 필요 여부 예측

        Args:
            components: 채팅 데이터
            api_spec
        """
        logger.info(f"[디버깅] DtoModelChain - 프롬프트 준비 시작")

        components_prompt = PromptBuilder.build_component_prompt(components)
        api_spec_prompt = PromptBuilder.build_api_spec_prompt(api_spec)
        format_instructions = {
            "api_spec": api_spec_prompt,
            "components_prompt": components_prompt,
            "output_instructions": PydanticOutputParser(pydantic_object=DtoModelChainList).get_format_instructions(),
        }

        logger.info(f"[디버깅] DtoModelChain - 프롬프트 구성 완료\nf{self.prompt.format(**format_instructions)}")
        logger.info(f"[디버깅] ComponentChain - LLM 요청 시작")
        result: DtoModelChainList = await self.chain.ainvoke(format_instructions)
        logger.info(f"[디버깅] DtoModelChain - LLM 요청 완료 - DTO 모델 개수: {len(result.dto)}")
        logger.info(f"[디버깅] DtoModelChain - LLM 요청 완료 - 결과 데이터\n {result}")

        return result.dto