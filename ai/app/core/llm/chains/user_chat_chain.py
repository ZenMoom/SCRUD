import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.core.llm.prompts.user_chat_prompts import get_user_chat_prompt
from app.core.models.diagram_model import DiagramChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload
from app.core.models.user_chat_model import UserChatChainPayload, SystemChatChainPayload

logger = logging.getLogger(__name__)


class UserChatChain:
    """프롬프트 처리 체인"""

    def __init__(self, llm: BaseChatModel):
        """프롬프트 처리 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm
        self.chain = (
            {
                "global_files": RunnablePassthrough(),
                "diagram": RunnablePassthrough(),
                "output_instructions": RunnablePassthrough(),

                "tag": RunnablePassthrough(),
                "prompt_type": RunnablePassthrough(),
                "message": RunnablePassthrough(),
                "code_data": RunnablePassthrough(),
            }
            | get_user_chat_prompt()
            | self.llm
            | PydanticOutputParser(pydantic_object=SystemChatChainPayload)
        )
        logger.info("프롬프트 처리 체인 초기화됨")

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
        logger.info("채팅 기반 프롬프트 처리 시작")
        logger.info(f"chat_data: {chat_data}")
        logger.info(f"global_data: {global_files}")
        logger.info(f"current_diagram: {current_diagram}")
        # 채팅 데이터 프롬프트 구성
        parser = PydanticOutputParser(pydantic_object=SystemChatChainPayload).get_format_instructions()
        logger.info(f"parser: {parser}")

        global_file = global_files.model_json_schema()
        input_variables = {
            "output_instructions": parser,
            "global_files": global_file,
            "diagram": current_diagram.model_json_schema(),

            "tag": chat_data.tag,
            "prompt_type": chat_data.promptType,
            "message": chat_data.message,
            "code_data": chat_data.targetMethods,
        }
        logger.info(f"input_variables: {input_variables}")

        # LLM을 사용하여 구조화된 출력 생성
        result = await self.chain.ainvoke(
            input_variables
        )



        logger.info(f"채팅 데이터: {result}")
        return result