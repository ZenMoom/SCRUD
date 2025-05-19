import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel

from app.core.llm.prompts.component_prompts import get_component_prompt
from app.core.models.diagram_model import ComponentChainPayload
from app.core.models.user_chat_model import SystemChatChainPayload
from app.utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

class ComponentChainPayloadList(BaseModel):
    components: List[ComponentChainPayload]

class ComponentChain:
    """컴포넌트 데이터 획득 체인"""

    def __init__(self, llm: BaseChatModel):
        """컴포넌트 데이터 획득 체인 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm
        self.prompt: ChatPromptTemplate  = get_component_prompt()

        # LCEL을 사용한 체인 구성
        self.chain = (
                {
                    "system_chat_prompt": RunnablePassthrough(),
                    "output_instructions": RunnablePassthrough(),
                }
                | self.prompt
                | self.llm
                | PydanticOutputParser(pydantic_object=ComponentChainPayloadList)
        )


    async def predict(self, chat_data: SystemChatChainPayload) -> List[ComponentChainPayload]:
        """채팅 데이터를 기반으로 다이어그램 필요 여부 예측

        Args:
            chat_data: 채팅 데이터

        Returns:
            다이어그램 필요 여부
        """
        logger.info(f"[디버깅] ComponentChain - 프롬프트 준비 시작")

        system_chat_prompt = PromptBuilder.build_system_chat_prompt(chat_data)
        format_instructions = {
            "system_chat_prompt": system_chat_prompt,
            "output_instructions": PydanticOutputParser(
                pydantic_object=ComponentChainPayloadList).get_format_instructions(),
        }
        logger.info(f"[디버깅] ComponentChain - 프롬프트 구성 완료\nf{self.prompt.format(**format_instructions)}")

        logger.info(f"[디버깅] ComponentChain - LLM 요청 시작")

        result: ComponentChainPayloadList = await self.chain.ainvoke(format_instructions)
        ComponentChain.generate_component_uuid(result.components)

        logger.info(f"[디버깅] ComponentChain - LLM 요청 완료 - Component 모델 개수: {len(result.components)}")
        logger.info(f"[디버깅] ComponentChain - LLM 요청 완료 - 결과 데이터: {result}")
        return result.components

    @staticmethod
    def generate_component_uuid(component_payloads: List[ComponentChainPayload]):
        # ComponentChainPayload 의 methodId 를
        def generate_uuid():
            import uuid
            return str(uuid.uuid4())

        for component in component_payloads:
            for method in component.methods:
                method.methodId = generate_uuid()
                logger.info(f"[디버깅] generate_component_uuid uuid 생성: {method.methodId}")
