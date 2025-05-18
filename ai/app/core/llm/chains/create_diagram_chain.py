import logging
from typing import List

from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.core.llm.chains.component_chain import ComponentChainPayloadList
from app.core.llm.prompts.create_diagram_prompt import get_create_diagram_prompt
from app.core.models.diagram_model import ComponentChainPayload
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.utils.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)


class CreateDiagramChain:
    """다이어그램 생성 체인"""

    def __init__(self, llm: BaseChatModel):
        """다이어그램 생성 체인 초기화

        Args:
            llm: LLM 인터페이스
        """
        self.llm = llm
        self.prompt_builder = PromptBuilder()

        # LCEL을 사용한 체인 구성
        self.chain = (
            {
                "complete_prompt": RunnablePassthrough(),
                "output_instructions": RunnablePassthrough(),
            }
            | get_create_diagram_prompt()
            | self.llm
            | PydanticOutputParser(pydantic_object=ComponentChainPayloadList)
        )

        logger.info("DTO 데이터 획득 체인 초기화됨")

    async def predict(
            self,
            api_spec: ApiSpec,
            global_files: GlobalFileList
    ) -> List[ComponentChainPayload]:
        """다이어그램 생성 체인 생성

        Args:
            api_spec: API 정보
            global_files: 전역 설정 파일 정보
        """

        # 각 프롬프트 구성
        api_spec_prompt = self.prompt_builder.build_api_spec_prompt(api_spec)
        global_data_prompt = self.prompt_builder.build_global_data_prompt(global_files)

        # 프롬프트 조합
        prompts = [api_spec_prompt, global_data_prompt]
        complete_prompt = self.prompt_builder.build_complete_prompt(prompts)

        logger.info(f"API 명세 데이터: {complete_prompt}")
        result: ComponentChainPayloadList = await self.chain.ainvoke({
            "complete_prompt" : complete_prompt,
            "output_instructions" : PydanticOutputParser(
                pydantic_object=ComponentChainPayloadList
            ).get_format_instructions(),
        })

        return result.components