import logging
from typing import Tuple

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser, PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import Field, BaseModel

from app.core.models.user_chat_model import SystemChatChainPayload

logger = logging.getLogger(__name__)

class ChatSummaryChainPayload(BaseModel):
    two_phrase_summary : str = Field("다이어그램 생성됨", description="한국어 기준 두 단어 요약")
    brief_summary : str = Field("컨트롤러 주석 추가 버전", description="한국어 기준 15음절로 요약")

class   ChatSummaryChain:
    """채팅 내용을 짧게 요약하는 체인"""

    def __init__(self, llm: BaseChatModel):
        """채팅 요약 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm

        summary_template = """
        LLM의 응답 채팅을 읽고
        한국어로 요약해주세요. 총 2개의 요약을 제공해주세요.
         
        1. 15음절 이하로 요약
        2. 2~3단어 이하로 요약   

        LLM 응답 채팅
        {message}
        """
        
        self.prompt = PromptTemplate.from_template(summary_template)
        self.chain = (
            self.prompt
            | self.llm
            | PydanticOutputParser(pydantic_object=ChatSummaryChainPayload)
        )

    async def predict(self, system_chat: SystemChatChainPayload) -> Tuple[str, str]:
        """채팅 내용을 요약

        Args:
            system_chat: 채팅 데이터

        Returns:
            5단어 이내로 요약된 문자열
        """
        logger.info(f"[디버깅] ChatSummaryChain - 요약 프롬프트 준비")
        
        # 입력 데이터 구성
        format_instructions = {
            "message": system_chat.message,
        }

        logger.info(f"[디버깅] ChatSummaryChain - 프롬프트 구성 완료\nf{self.prompt.format(**format_instructions)}")
        result: ChatSummaryChainPayload = await self.chain.ainvoke(format_instructions)
        logger.info(f"[디버깅] ChatSummaryChain - LLM 요청 완료 - 요약 결과: {result}")

        return result.breif_summary, result.two_phrase_summary