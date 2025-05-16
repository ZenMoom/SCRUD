import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from pydantic_core import ValidationError

from app.core.prompts.message.create_diagram_human_message import prepare_diagram_generate_human_message
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram


class DiagramCreateGenerator:
    from langchain.chat_models.base import BaseChatModel
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        self.parser = PydanticOutputParser(pydantic_object=Diagram)
        self.logger = logging.getLogger(__name__)

    async def generate_diagram_with_llm(
        self,
        project_id: str,
        api_id: str,
        global_files: GlobalFileList,
        api_spec: ApiSpec,
    ) -> Diagram:

        input_msg = self._setup_input_msg(api_id, api_spec, global_files, project_id)
        self.logger.info(f"생성된 입력 데이터... {input_msg[:500]}")
        llm_response: Dict = await self._call_agent(input_msg)

        try:
            diagram: Diagram = self.parser.parse(llm_response["output"])

            # 프로젝트 ID와 API ID 확인 및 설정
            diagram.projectId = project_id
            diagram.apiId = api_id

            return diagram

        except Exception as e:
            from fastapi import HTTPException

            self.logger.error(f"다이어그램 생성 중 오류 발생: {str(e)}")
            raise HTTPException(status_code=500, detail="다이어그램 생성 중 서버 오류가 발생했습니다.")

    def _setup_input_msg(self, api_id, api_spec, global_files, project_id) -> str:
        self.logger.info(f"입력 데이터 -> api_id: {api_id}, project_id: {project_id} ")
        self.logger.info(f"전역 파일 데이터 -> {global_files if global_files else '없습니다.'}")
        self.logger.info(f"API 데이터 -> {api_spec if api_spec else '없습니다'}")

        return prepare_diagram_generate_human_message(
            global_files=global_files,
            api_spec=api_spec,
            project_id=project_id,
            api_id=api_id,
        )

    def _setup_prompt(self) -> ChatPromptTemplate:
        from app.core.prompts.message.create_diagram_system_message import prepare_diagram_generate_system_message
        system_message = prepare_diagram_generate_system_message(self.parser)

        from langchain_core.messages import SystemMessage
        return ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=system_message),
                HumanMessage(content="{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

    def _setup_tools(self):
        """도구를 설정합니다."""
        @tool
        def generate_uuid() -> str:
            """UUID를 생성합니다. 다이어그램 내 각 요소의 ID를 생성할 때 사용하세요."""
            return str(uuid.uuid4())

        @tool
        def get_current_datetime() -> str:
            """현재 날짜와 시간을 ISO 형식으로 반환합니다."""
            return datetime.now().isoformat()

        # @tool
        # def validate_diagram_fields(diagram_str: str) -> bool:
        #     """
        #     [입력] 생성한 다이어그램 JSON
        #     [출력]
        #     입력된 다이어그램 데이터가 유효한지 검증합니다.
        #     True: 검증 성공, False: 검증 실패
        #     """
        #     try:
        #         diagram: Diagram = Diagram.model_validate_json(diagram_str)
        #         # return diagram.validate_diagram_ids()
        #         return True
        #     except ValidationError:
        #         return False


        # return [generate_uuid, get_current_datetime, validate_diagram_fields]
        return [generate_uuid, get_current_datetime]

    async def _call_agent(
        self,
        input_msg: str
    ) -> Dict[str, Any]:
        tools = self._setup_tools()

        agent = create_tool_calling_agent(
            llm=self.llm,
            tools=tools,
            prompt=self._setup_prompt(),
        )

        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
        )

        return await agent_executor.ainvoke({"input": input_msg})
