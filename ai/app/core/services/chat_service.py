import asyncio
from typing import Optional, Tuple, Any

from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import load_prompt
from langchain_core.messages import HumanMessage

from app.core.generator.model_generator import ModelGenerator
# 앞서 정의한 Pydantic 모델 사용
from app.core.models.prompt_models import Diagram
from app.infrastructure.mongodb.repository.mongo_repository import MongoRepository
from app.core.prompts.few_shot_prompt_template import DiagramPromptGenerator


class ChatService:
    """
    OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 서비스
    """

    def __init__(
             self,
             model_name: Optional[str] = None,
             model_generator: Optional[ModelGenerator] = None,
             repository: Optional[MongoRepository] = None,
    ):
        """
        ChatService 초기화

        Args:
            model_name (str, optional): 사용할 LLM 모델 이름
            model_generator (ModelGenerator, optional): 모델 생성기 인스턴스

        """
        self.model_name = model_name
        self.model_generator = model_generator or ModelGenerator()
        self.repository = repository
        self.llm = None
        self.parser = None

    def setup_llm_and_parser(self, response_queue: asyncio.Queue) -> Tuple[Any, PydanticOutputParser]:
        """
        LLM 모델과 출력 파서를 설정하는 메서드

        Returns:
            Tuple: (LLM 모델, Pydantic 출력 파서)
        """
        try:
            if not self.model_name:
                raise ValueError("모델 이름이 설정되지 않았습니다.")
                
            self.llm = self.model_generator.get_chat_model(self.model_name, response_queue)
            self.parser = PydanticOutputParser(pydantic_object=Diagram)
            return self.llm, self.parser
        except Exception as e:
            print(f"LLM 및 파서 설정 중 오류 발생: {str(e)}")
            raise

    async def generate_diagram_data(self, openapi_spec: str) -> Diagram:
        """
        LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하는 메서드

        Args:
            openapi_spec (str): OpenAPI 명세 데이터

        Returns:
            Diagram: 생성된 도식화 데이터
        """
        try:
            if not self.llm or not self.parser:
                raise ValueError("모델이 없습니다.")
                
            # 프롬프트 생성
            template = DiagramPromptGenerator()
            prompt = template.get_prompt().format(openapi_spec=openapi_spec)

            # LLM으로 도식화 데이터 생성
            print(f"[디버깅] 모델 호출 시작")

            response = await self.llm.ainvoke(
                [
                    HumanMessage(content=prompt),
                    HumanMessage(content=self.parser.get_format_instructions()),
                ]
            )
            print(f"[디버깅] 모델 호출 완료")

            # 파서를 통해 응답 처리
            print(response.content)
            diagram_data = self.parser.parse(response.content)
            return diagram_data
        except Exception as e:
            print(f"도식화 데이터 생성 중 오류 발생: {str(e)}")
            raise

    async def create_diagram_from_openapi(self, openapi_spec: str, response_queue: asyncio.Queue) -> Diagram:
        """
        OpenAPI 명세를 입력받아 도식화 데이터(Diagram)를 생성하는 메인 메서드

        Args:
            openapi_spec (str): OpenAPI 명세 데이터(YAML 또는 JSON 형식)
        Returns:
            Diagram: 생성된 도식화 데이터
        """
        try:

            # LLM 및 파서 설정
            self.setup_llm_and_parser(response_queue)

            # 도식화 데이터 생성
            diagram_data = await self.generate_diagram_data(openapi_spec)

            # MongoDB에 저장
            inserted_id = await self.repository.insert_one(diagram_data)

            # 생성된 도식화 데이터 반환
            return diagram_data

        except Exception as e:
            print(f"도식화 데이터 생성 프로세스 중 오류 발생: {str(e)}")
            raise