import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm.prompts.user_chat_prompts import get_user_chat_prompt
from app.core.models.diagram_model import DiagramChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload
from app.core.models.user_chat_model import UserChatChainPayload, SystemChatChainPayload
from app.utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)


class UserChatChain:
    """프롬프트 처리 체인"""

    def __init__(self, llm: BaseChatModel):
        """프롬프트 처리 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm
        self.prompt: ChatPromptTemplate = get_user_chat_prompt()
        self.chain = (
              self.prompt
            | self.llm
            | PydanticOutputParser(pydantic_object=SystemChatChainPayload)
        )

    async def predict(
            self,
            chat_data: UserChatChainPayload,
            global_files: GlobalFileListChainPayload,
            current_diagram: DiagramChainPayload,
    ) -> SystemChatChainPayload:
        """채팅 기반 흐름 처리

        Args:
            chat_data: 채팅 데이터
            global_files: 전역 데이터
            current_diagram: 다이어그램

        Returns:
            처리 결과
        """
        chat_prompt = PromptBuilder.build_user_chat_prompt(chat_data)
        global_files_prompt = PromptBuilder.build_global_file_list_prompt(global_files)
        diagram_prompt =  PromptBuilder.build_diagram_prompt(current_diagram)

        logger.info(f"[디버깅] UserChatChain - 프롬프트 준비 시작")
        # 채팅 데이터 프롬프트 구성
        format_instructions = {
            "user_chat": chat_prompt,
            "global_files": global_files_prompt,
            "diagram": diagram_prompt,
            "output_instructions": PydanticOutputParser(pydantic_object=SystemChatChainPayload).get_format_instructions()
        }
        logger.info(f"[디버깅] UserChatChain - 프롬프트 구성 완료\nf{self.prompt.format(**format_instructions)}")

        logger.info(f"[디버깅] UserChatChain - LLM 요청 시작")
        result = await self.chain.ainvoke(
            format_instructions
        )
        logger.info(f"[디버깅] UserChatChain - LLM 요청 완료 - 결과 데이터\n {result}")

        return result