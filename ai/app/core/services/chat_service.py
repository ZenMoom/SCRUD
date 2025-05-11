import asyncio
import json
import logging
from typing import Optional, Tuple, Any

from langchain.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage

from app.core.generator.model_generator import ModelGenerator

from app.core.models.prompt_models import Diagram, UserChatRequest
from app.core.prompts.few_shot_prompt_template import DiagramPromptGenerator
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository

class ChatService:
    """
    OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 서비스
    """

    def __init__(
            self,
            model_name: Optional[str] = None,
            model_generator: Optional[ModelGenerator] = None,
            diagram_repository: Optional[DiagramRepository] = None,
            chat_repository: Optional[ChatRepository] = None,
            logger: Optional[logging.Logger] = None,

    ):
        """
        ChatService 초기화

        Args:
            model_name (str, optional): 사용할 LLM 모델 이름
            model_generator (ModelGenerator, optional): 모델 생성기 인스턴스

        """
        self.model_name = model_name
        self.model_generator = model_generator or ModelGenerator()
        self.diagram_repository = diagram_repository
        self.chat_repository = chat_repository
        self.llm = None
        self.parser = None
        self.logger = logger or logging.getLogger(__name__)

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
            self.logger.info(f"LLM 및 파서 설정 중 오류 발생: {str(e)}")
            raise

    async def generate_diagram_data(self, user_chat_data: UserChatRequest, project_id: str = None,
                                    api_id: str = None) -> Diagram:
        """
        LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 메서드

        Args:
            user_chat_data (UserChatRequest): 요청 데이터
            project_id (str, optional): 프로젝트 ID. 저장 시 필요
            api_id (str, optional): API ID. 저장 시 필요

        Returns:
            Diagram: 생성된 도식화 데이터
        """
        try:
            if not self.llm or not self.parser:
                raise ValueError("모델이 없습니다.")

            # 프롬프트 생성
            template = DiagramPromptGenerator()
            prompt = template.get_prompt().format(openapi_spec=user_chat_data.promptType)

            # LLM으로 도식화 데이터 생성
            self.logger.info(f"[디버깅] 모델 호출 시작")

            response = await self.llm.ainvoke(
                [
                    HumanMessage(content=prompt),
                    HumanMessage(content=self.parser.get_format_instructions()),
                ]
            )
            self.logger.info(f"[디버깅] 모델 호출 완료")

            # 파서를 통해 응답 처리
            self.logger.info(f"모델 응답 내용: {response.content[:500]}...")
            diagram_data = self.parser.parse(response.content)

            # 생성된 도식화 데이터에 프로젝트 ID와 API ID 설정
            if project_id and api_id:
                self.logger.info(f"다이어그램 메타데이터 설정: project_id={project_id}, api_id={api_id}")

                # 필요한 ID 및 메타데이터 설정
                import uuid
                from datetime import datetime
                from app.infrastructure.mongodb.repository.model.diagram_model import Metadata

                self.logger.info("기존 다이어그램 조회 중...")
                all_diagrams = await self.diagram_repository.find_many({
                    "projectId": project_id,
                    "apiId": api_id
                }, sort=[("metadata.version", -1)])

                latest_diagram = all_diagrams[0] if all_diagrams else None

                # 버전 설정
                version = 1
                if latest_diagram:
                    version = latest_diagram.metadata.version + 1
                    self.logger.info(f"기존 다이어그램 발견: 버전 증가 {latest_diagram.metadata.version} -> {version}")
                else:
                    self.logger.info("기존 다이어그램 없음: 초기 버전 설정")

                # 다이어그램 데이터 설정
                diagram_data.projectId = project_id
                diagram_data.apiId = api_id
                diagram_data.diagramId = str(uuid.uuid4())

                # 메타데이터 설정
                if not hasattr(diagram_data, 'metadata') or not diagram_data.metadata:
                    diagram_data.metadata = Metadata(
                        metadataId=str(uuid.uuid4()),
                        version=version,
                        lastModified=datetime.now(),
                        name=f"API Diagram for {api_id}",
                        description=f"Generated from OpenAPI spec"
                    )
                else:
                    diagram_data.metadata.version = version
                    diagram_data.metadata.lastModified = datetime.now()

                # MongoDB에 저장
                self.logger.info(f"다이어그램 MongoDB에 저장 중: diagramId={diagram_data.diagramId}, version={version}")
                inserted_id = await self.diagram_repository.insert_one(diagram_data)
                self.logger.info(f"다이어그램 저장 완료: id={inserted_id}")

            return diagram_data
        except Exception as e:
            self.logger.error(f"도식화 데이터 생성 중 오류 발생: {str(e)}", exc_info=True)
            raise

    async def create_diagram_from_openapi(self, user_chat_data: UserChatRequest, response_queue: asyncio.Queue,
                                          project_id: str = None, api_id: str = None) -> Diagram:
        """
        OpenAPI 명세를 입력받아 도식화 데이터(Diagram)를 생성하는 메인 메서드

        Args:
            user_chat_data: UserChatRequest
            response_queue: asyncio.Queue: LLM 응답 데이터를 저장할 큐
            project_id (str, optional): 프로젝트 ID
            api_id (str, optional): API ID
        Returns:
            Diagram: 생성된 도식화 데이터
        """
        try:
            self.logger.info(f"도식화 데이터 생성 시작: project_id={project_id}, api_id={api_id}")

            # LLM 및 파서 설정
            self.setup_llm_and_parser(response_queue)

            # 진행 상황 메시지 전송
            if response_queue:
                await response_queue.put(json.dumps({
                    "type": "progress",
                    "data": "AI 모델이 다이어그램 생성 중..."
                }))

            # 도식화 데이터 생성 및 MongoDB에 자동 저장
            diagram_data: Diagram = await self.generate_diagram_data(user_chat_data, project_id, api_id)

            # 진행 상황 메시지 전송
            if response_queue:
                await response_queue.put(json.dumps({
                    "type": "progress",
                    "data": "다이어그램 생성 완료, 데이터 반환 중..."
                }))

            self.logger.info(
                f"도식화 데이터 생성 완료: diagramId={diagram_data.diagramId if hasattr(diagram_data, 'diagramId') else 'N/A'}")

            # 생성된 도식화 데이터 반환
            return diagram_data

        except Exception as e:
            self.logger.error(f"도식화 데이터 생성 프로세스 중 오류 발생: {str(e)}", exc_info=True)

            # 오류 메시지 전송
            if response_queue:
                await response_queue.put(json.dumps({
                    "type": "error",
                    "data": f"도식화 데이터 생성 중 오류 발생: {str(e)}"
                }))

            raise
