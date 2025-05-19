import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

from app.core.llm.chains.component_chain import ComponentChainPayloadList
from app.core.llm.prompts.create_diagram_component_prompt import get_create_diagram_component_prompt
from app.core.models.diagram_model import ComponentChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload, ApiSpecChainPayload
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)


class CreateDiagramComponentChain:
    """다이어그램 생성 체인"""

    def __init__(self, llm: BaseChatModel):
        """다이어그램 생성 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm
        self.prompt_builder = PromptBuilder()
        self.prompt: ChatPromptTemplate = get_create_diagram_component_prompt()

        # LCEL을 사용한 체인 구성
        self.chain = (
            {
                "api_spec_prompt": RunnablePassthrough(),
                "global_files_prompt": RunnablePassthrough(),
                "output_instructions": RunnablePassthrough(),
            }
            | self.prompt
            | self.llm
            | PydanticOutputParser(pydantic_object=ComponentChainPayloadList)
        )

    async def predict(
            self,
            api_spec: ApiSpecChainPayload,
            global_files: GlobalFileListChainPayload
    ) -> List[ComponentChainPayload]:
        """다이어그램 생성 체인 생성

        Args:
            api_spec: API 정보
            global_files: 전역 설정 파일 정보
        """
        logger.info(f"[디버깅] CreateDiagramComponentChain - 프롬프트 준비 시작")

        # 각 프롬프트 구성
        api_spec_prompt: str = self.prompt_builder.build_api_spec_prompt(api_spec)
        global_files_prompt: str = self.prompt_builder.build_global_file_list_prompt(global_files)

        format_instructions = {
            "api_spec_prompt": api_spec_prompt,
            "global_files_prompt": global_files_prompt,
            "output_instructions": PydanticOutputParser(
                pydantic_object=ComponentChainPayloadList
            ).get_format_instructions(),
        }

        logger.info(f"[디버깅] CreateDiagramComponentChain - 프롬프트 구성 완료\n{self.prompt.format(**format_instructions)}")


        logger.info(f"[디버깅] CreateDiagramComponentChain - LLM 요청 시작")
        result: ComponentChainPayloadList = await self.chain.ainvoke(format_instructions)

        logger.info(f"[디버깅] CreateDiagramComponentChain - LLM 요청 완료 - 컴포넌트 개수: {len(result.components)}")
        logger.info(f"[디버깅] CreateDiagramComponentChain - LLM 요청 완료 - 결과 데이터\n{result}")

        return result.components