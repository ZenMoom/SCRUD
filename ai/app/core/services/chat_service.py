import asyncio
import logging
from typing import Optional, Tuple, Any, Dict, List
from datetime import datetime

from langchain.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import Tool, ToolException
import json

from app.api.dto.diagram_dto import UserChatRequest, DiagramResponse, ChatResponse, ChatResponseList
from app.core.generator.model_generator import ModelGenerator
from app.core.prompts.few_shot_prompt_template import DiagramPromptGenerator
from app.core.services.sse_service import SSEService
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, MethodPromptTagEnum, \
    MethodPromptTargetEnum, UserChat, SystemChat, Chat, VersionInfo, PromptResponseEnum


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
            sse_service: Optional[SSEService] = None,
            logger: Optional[logging.Logger] = None,
    ):
        """
        ChatService 초기화

        Args:
            model_name (str, optional): 사용할 LLM 모델 이름
            model_generator (ModelGenerator, optional): 모델 생성기 인스턴스
            diagram_repository (DiagramRepository, optional): 다이어그램 저장소
            chat_repository (ChatRepository, optional): 채팅 저장소
            sse_service (SSEService, optional): SSE 서비스
            logger (logging.Logger, optional): 로깅 객체
        """
        self.model_name = model_name
        self.model_generator = model_generator or ModelGenerator()
        self.diagram_repository = diagram_repository
        self.chat_repository = chat_repository
        self.sse_service = sse_service or SSEService(logger)
        self.llm = None
        self.parser = None
        self.agent_executor = None
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

    def setup_agent(self, response_queue: asyncio.Queue) -> None:
        """
        Langchain Agent를 설정하는 메서드

        Args:
            response_queue: 응답 큐
        """
        try:
            if not self.model_name:
                raise ValueError("모델 이름이 설정되지 않았습니다.")

            # LLM 모델 설정
            self.llm = self.model_generator.get_chat_model(self.model_name, response_queue)

            # Agent를 위한 도구 정의
            tools = [
                Tool(
                    name="generate_diagram",
                    description="도식화를 생성하는 도구입니다. 사용자의 요청이 도식화 생성이나 수정을 필요로 할 때 이 도구를 사용합니다. 이 도구는 반드시 '도식화를 생성합니다' 메시지로 시작해야 합니다.",
                    func=lambda input_str: f"도식화를 생성합니다. 이유: {input_str}"
                ),
                Tool(
                    name="simple_response",
                    description="단순히 사용자 질문에 답변만 하는 도구입니다. 도식화 생성이 필요 없을 때 사용합니다.",
                    func=lambda input_str: input_str
                )
            ]

            # Agent 프롬프트 템플릿 설정
            prompt = ChatPromptTemplate.from_messages([
                ("system", """
                당신은 API 명세와 도식화를 생성하고 관리하는 AI 서비스의 일부입니다.
                사용자의 요청을 분석하여 도식화 생성이 필요한지 결정한 다음, 적절한 응답을 제공해야 합니다.

                # 결정 가이드라인
                도식화 생성이 필요한 경우 (generate_diagram 도구 사용):
                1. 코드 구현, 업데이트, 수정이 필요한 요청
                2. 새로운 컴포넌트나 메서드 추가 요청
                3. 성능 최적화나 코드 리팩토링 요청
                4. 구조 변경이 필요한 요청
                5. 사용자가 명시적으로 도식화 생성/수정을 요청하는 경우

                도식화 생성이 필요 없는 경우 (simple_response 도구 사용):
                1. 단순 정보 요청이나 설명 요청
                2. 설명이나 분석만 필요한 경우
                3. 코드 구현이나 변경 없이 질문에 답변만 필요한 경우

                # 메시지 분석
                1. MethodPromptTagEnum 값을 확인하세요:
                   - IMPLEMENT, REFACTORING, OPTIMIZE는 일반적으로 도식화 생성이 필요합니다.
                   - EXPLAIN, ANALYZE, DOCUMENT는 일반적으로 도식화 생성이 필요 없습니다.
                   - 하지만 이것은 절대적인 규칙이 아닙니다. 메시지 내용을 우선적으로 고려하세요.

                2. 메시지 내용을 더 중요하게 고려하세요:
                   - "만들어줘", "구현해줘", "변경해줘", "추가해줘"와 같은 요청은 도식화 생성이 필요할 가능성이 높습니다.
                   - "설명해줘", "이해하기 어려워", "왜 이렇게 되어 있어?"와 같은 질문은 도식화 생성이 필요 없을 가능성이 높습니다.

                # 중요: 도식화 생성 여부를 결정할 때 반드시 명시적으로 generate_diagram 또는 simple_response 도구를 사용하세요.
                두 도구 중 하나를 사용할 때 반드시 결정 이유를 포함해야 합니다.
                """
                ),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ])

            # Agent 생성
            agent = create_openai_functions_agent(self.llm, tools, prompt)

            # Agent Executor 생성
            self.agent_executor = AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
                handle_parsing_errors=True
            )

            self.logger.info("Agent 설정 완료")
        except Exception as e:
            self.logger.error(f"Agent 설정 중 오류 발생: {str(e)}", exc_info=True)
            raise


    async def generate_diagram_data(self, user_chat_data: UserChatRequest, project_id: str = None,
                                    api_id: str = None) -> DiagramResponse:
        """
        LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 메서드

        1. UserChatRequest에서 targetMethods 통해 methodId가 속한 diagramId를 가져온다. (targetMethods에는 methodId가 존재)
        2. diagramId 를 통해 Diagram을 mongoDB에서 조회하기
        3. UserChatRequest
            MethodPromptTarget
            - SIGNATURE 인 경우: 모든 메서드를 새로 작성한다.
            - BODY 인 경우: 선택한 메서드만 작성한다.
            MethodPromptTag
            - 각 태그에 맞는 미리 준비된 프롬프트를 세팅한 후 수정한다.
            message
            - MethodPromptTarget, MethodPromptTag가 처리된 이후에 마지막에 사용자가 입력한 메시지가 작성된다.
        4. 메타 데이터 설정
            version
        Args:
            user_chat_data (UserChatRequest): 요청 데이터
            project_id (str, optional): 프로젝트 ID. 저장 시 필요
            api_id (str, optional): API ID. 저장 시 필요

        Returns:
            Diagram: 생성된 도식화 데이터
        """

        try:
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

    async def prompt_diagram_from_openapi(
        self,
        user_chat_data: UserChatRequest,
        latest_diagram: Diagram,
        response_queue: Optional[asyncio.Queue] = None,
        project_id: str = None,
        api_id: str = None
    ) -> DiagramResponse:
        """
        LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 메서드

        Args:
            user_chat_data (UserChatRequest): 사용자 채팅 요청 데이터
            latest_diagram: Diagram
            response_queue (asyncio.Queue, optional): 실시간 응답을 위한 비동기 큐 (None이면 스트리밍 모드 비활성화)
            project_id (str, optional): 프로젝트 ID
            api_id (str, optional): API ID

        Returns:
            DiagramResponse: 생성된 도식화 데이터
        """
        self.logger.info(f"prompt_diagram_from_openapi 메서드 시작: project_id={project_id}, api_id={api_id}")
        self.logger.info(f"User request: tag={user_chat_data.tag}, promptType={user_chat_data.promptType}")
        self.logger.info(f"Target methods count: {len(user_chat_data.targetMethods)}")

        try:
            self.setup_llm_and_parser(response_queue)
            # 프롬프트 생성
            self.logger.info("프롬프트 생성 시작")

            # PromptType에 따른 프롬프트 조정
            if user_chat_data.promptType == MethodPromptTargetEnum.SIGNATURE:
                self.logger.info("SIGNATURE 모드: 메서드 시그니처 업데이트")
                prompt_type_instruction = "메서드의 시그니처를 설명에 맞도록 업데이트 해주세요."
            else:  # BODY 모드
                self.logger.info("BODY 모드: 특정 메서드 본문만 업데이트")
                target_method_ids = [m.get("methodId") for m in user_chat_data.targetMethods if "methodId" in m]
                prompt_type_instruction = f"다음 메서드의 본문만 업데이트해주세요: {', '.join(target_method_ids)}"

            # PromptTag에 따른 프롬프트 조정
            self.logger.info(f"프롬프트 태그: {user_chat_data.tag}")
            tag_instructions = {
                MethodPromptTagEnum.EXPLAIN: "메서드의 동작을 자세히 설명하는 주석과 함께 코드를 작성해주세요.",
                MethodPromptTagEnum.REFACTORING: "코드를 더 효율적이고 가독성 좋게 리팩토링해주세요.",
                MethodPromptTagEnum.OPTIMIZE: "성능 최적화에 중점을 두고 코드를 개선해주세요.",
                MethodPromptTagEnum.DOCUMENT: "상세한 문서화에 중점을 두고 작성해주세요.",
                MethodPromptTagEnum.CONVENTION: "코딩 컨벤션을 엄격히 준수하여 작성해주세요.",
                MethodPromptTagEnum.ANALYZE: "코드의 구조와 동작을 분석하는 설명을 포함해주세요.",
                MethodPromptTagEnum.IMPLEMENT: "기능 요구사항에 맞게 완전한 구현을 제공해주세요."
            }
            tag_instruction = tag_instructions.get(user_chat_data.tag, "")

            # 기본 프롬프트 템플릿 가져오기
            template = DiagramPromptGenerator()
            base_prompt = template.get_prompt()

            # 최종 프롬프트 생성
            openapi_spec = latest_diagram.dict()  # 현재 다이어그램 데이터를 프롬프트에 포함
            self.logger.info(f"openapi_spec: {openapi_spec}")

            # datetime 객체를 문자열로 변환하는 사용자 정의 JSON 인코더
            class DateTimeEncoder(json.JSONEncoder):
                def default(self, obj):
                    from datetime import datetime
                    if isinstance(obj, datetime):
                        return obj.isoformat()
                    return super().default(obj)

            complete_prompt = f"""
            {base_prompt.format(openapi_spec=json.dumps(openapi_spec, indent=2, cls=DateTimeEncoder))}

            요청 사항:
            {prompt_type_instruction}
            {tag_instruction}

            사용자 메시지:
            {user_chat_data.message}
            """

            self.logger.info(f"생성된 프롬프트 일부: {complete_prompt[:300]}...")

            # LLM 호출
            self.logger.info("LLM 호출 시작")

            response = await self.llm.ainvoke(
                [
                    HumanMessage(content=complete_prompt),
                    HumanMessage(content=self.parser.get_format_instructions()),
                ]
            )


            self.logger.info("LLM 호출 완료")

            # 전체 응답 내용 로깅 (개발 및 디버깅용)
            self.logger.info(f"LLM 응답 전체 내용:\n{response.content}")

            # 응답 파싱
            self.logger.info("응답 파싱 시작")
            try:
                diagram_data = self.parser.parse(response.content)
                self.logger.info("응답 파싱 성공")
            except Exception as parse_error:
                self.logger.error(f"응답 파싱 실패: {str(parse_error)}", exc_info=True)
                self.logger.info(f"실패한 파싱 내용:\n{response.content[:1000]}...")
                raise

            # 다이어그램 업데이트 및 버전 관리
            self.logger.info("다이어그램 메타데이터 업데이트 시작")
            if project_id and api_id:
                # UUID 생성
                import uuid
                from datetime import datetime
                from app.infrastructure.mongodb.repository.model.diagram_model import Metadata

                diagram_data.projectId = project_id
                diagram_data.apiId = api_id
                diagram_data.diagramId = str(uuid.uuid4())

                # 버전 관리
                version = 1
                if latest_diagram:
                    version = latest_diagram.metadata.version + 1
                    self.logger.info(f"버전 업데이트: {latest_diagram.metadata.version} -> {version}")

                # 메타데이터 설정
                if not hasattr(diagram_data, 'metadata') or not diagram_data.metadata:
                    diagram_data.metadata = Metadata(
                        metadataId=str(uuid.uuid4()),
                        version=version,
                        lastModified=datetime.now(),
                        name=f"API Diagram for {api_id}",
                        description=f"Generated from OpenAPI spec using tag: {user_chat_data.tag}"
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

            await self.sse_service.send_error(response_queue, f"처리 중 오류가 발생했습니다: {str(e)}")
            await self.sse_service.close_stream(response_queue)

            raise

    async def create_diagram_async(
            self,
            project_id: str,
            api_id: str,
            user_chat_data: UserChatRequest,
            diagram_id: str
    ) -> None:
        """
        비동기적으로 도식화를 생성하는 메서드

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat_data: 사용자 채팅 데이터
            diagram_id: 생성할 도식화 ID
        """
        self.logger.info(f"비동기 도식화 생성 시작: project_id={project_id}, api_id={api_id}, diagram_id={diagram_id}")

        try:
            # 최신 다이어그램 조회 (가장 높은 버전)
            all_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if not latest_diagram:
                self.logger.error("기존 다이어그램이 없어 도식화를 생성할 수 없습니다.")
                return

            # 임시 응답 큐 생성 (비동기 처리를 위함)
            temp_queue = asyncio.Queue()
            self.setup_llm_and_parser(temp_queue)

            # 도식화 생성 로직 실행
            diagram = await self.prompt_diagram_from_openapi(
                user_chat_data=user_chat_data,
                latest_diagram=latest_diagram,
                response_queue=temp_queue,
                project_id=project_id,
                api_id=api_id
            )

            # 생성된 도식화의 ID를 지정된 ID로 업데이트
            diagram.diagramId = diagram_id

            # MongoDB에 저장
            await self.diagram_repository.update_one(
                {"diagramId": diagram_id},
                diagram
            )

            self.logger.info(f"비동기 도식화 생성 완료: diagram_id={diagram_id}")
        except Exception as e:
            self.logger.error(f"비동기 도식화 생성 중 오류 발생: {str(e)}", exc_info=True)

    async def process_chat_and_diagram(
            self, project_id: str, api_id: str, user_chat_data: UserChatRequest, response_queue: asyncio.Queue
    ) -> Dict:
        """
        채팅 요청을 처리하고 필요한 경우 다이어그램을 업데이트하는 백그라운드 태스크
        사용자의 요청을 UserChat으로, LLM의 응답을 SystemChat으로 저장한 다음 Chat 도큐먼트로 MongoDB에 저장
        AI가 직접 도식화 생성 여부를 판단합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat_data: 사용자 채팅 데이터
            response_queue: 응답 데이터를 전송할 큐

        Returns:
            Dict: 응답 정보 (도식화 생성 여부, 도식화 ID 등)
        """
        self.logger.info(f"채팅 및 다이어그램 처리 시작: project_id={project_id}, api_id={api_id}")

        try:
            # 최신 다이어그램 조회 (가장 높은 버전)
            all_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id,
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if latest_diagram:
                self.logger.info(
                    f"최신 다이어그램 조회: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")
            else:
                self.logger.info("기존 다이어그램이 없음. 첫 다이어그램 생성 필요")
                await self.sse_service.send_error(response_queue, "기존 다이어그램이 없어 처리할 수 없습니다.")
                await self.sse_service.close_stream(response_queue)
                return {"success": False, "error": "기존 다이어그램이 없어 처리할 수 없습니다."}

            # Agent 설정
            self.setup_agent(response_queue)

            # UserChat 객체 생성
            user_chat = UserChat(
                tag=user_chat_data.tag,
                promptType=user_chat_data.promptType,
                message=user_chat_data.message,
                targetMethods=user_chat_data.targetMethods
            )

            # MethodPromptTagEnum 기반 초기 판단
            initial_judgment = ""
            if user_chat_data.tag in [MethodPromptTagEnum.IMPLEMENT, MethodPromptTagEnum.REFACTORING, MethodPromptTagEnum.OPTIMIZE]:
                initial_judgment = "이 태그는 일반적으로 도식화 생성이 필요합니다."
            else:
                initial_judgment = "이 태그는 일반적으로 도식화 생성이 필요하지 않습니다."

            # Langchain Agent로 응답 생성
            agent_input = {
                "input": f"""
                사용자 메시지: {user_chat_data.message}
                태그: {user_chat_data.tag}
                메시지 타입: {user_chat_data.promptType}
                초기 판단: {initial_judgment}

                위 정보를 바탕으로 도식화 생성이 필요한지 판단하세요.
                도식화가 필요하면 반드시 generate_diagram 도구를 사용하고, 필요하지 않으면 simple_response 도구를 사용하세요.
                단순히 설명이나 분석만 필요한 경우는 도식화가 필요하지 않습니다.
                구현, 리팩토링, 최적화 등 코드 변경이 필요한 경우는 도식화가 필요합니다.
                """
            }

            self.logger.info("Agent에게 판단 요청")

            # 먼저 사용자 메시지에 대한 간단한 응답 생성
            standard_response = ""
            if user_chat_data.tag == MethodPromptTagEnum.EXPLAIN:
                standard_response = f"메서드에 대한 설명을 제공합니다: {user_chat_data.message}"
            elif user_chat_data.tag == MethodPromptTagEnum.ANALYZE:
                standard_response = f"코드 분석 결과: {user_chat_data.message}"
            elif user_chat_data.tag == MethodPromptTagEnum.IMPLEMENT:
                standard_response = f"구현을 진행합니다: {user_chat_data.message}"
            else:
                standard_response = f"요청을 처리합니다: {user_chat_data.message}"

            # 태그 기반으로 간단한 판단
            should_generate = user_chat_data.tag in [MethodPromptTagEnum.IMPLEMENT, MethodPromptTagEnum.REFACTORING, MethodPromptTagEnum.OPTIMIZE]

            try:
                agent_result = await self.agent_executor.ainvoke(agent_input)
                self.logger.info(f"Agent 결과: {agent_result}")
            except Exception as agent_error:
                self.logger.error(f"Agent 오류 발생: {str(agent_error)}")
                # 오류 발생시 간단한 대체 응답 사용
                agent_result = {
                    'output': standard_response,
                    'intermediate_steps': [
                        ({
                            'tool': 'generate_diagram' if should_generate else 'simple_response',
                            'tool_input': f"태그 {user_chat_data.tag}에 기반한 기본 결정"
                        },
                        f"도식화 {'생성' if should_generate else '미생성'} 결정: {user_chat_data.message}")
                    ]
                }
            agent_response = agent_result['output']
            tool_used = agent_result.get('intermediate_steps', [])

            self.logger.info(f"Agent 응답: {agent_response}")
            self.logger.info(f"사용된 도구: {tool_used}")

            # 도구 사용 결과 분석하여 도식화 생성 여부 판단
            should_generate = False
            for step in tool_used:
                action = step[0]  # AgentAction 또는 dict
                if isinstance(action, dict):
                    # 예외 처리 단계에서 생성된 경우
                    if action.get('tool') == "generate_diagram":
                        should_generate = True
                        self.logger.info(f"도식화 생성 판단 - 이유: {action.get('tool_input')}")
                        break
                else:
                    # 정상적으로 생성된 AgentAction 객체인 경우
                    if action.tool == "generate_diagram":
                        should_generate = True
                        self.logger.info(f"도식화 생성 판단 - 이유: {action.tool_input}")
                        break

            # 결과 처리
            diagram_id = None
            message = agent_response

            if should_generate:
                self.logger.info("AI가 도식화 생성이 필요하다고 판단했습니다.")

                # 새로운 도식화 ID 생성
                import uuid
                diagram_id = str(uuid.uuid4())

                # 클라이언트에게 도식화 ID 전송
                await self.sse_service.send_created(response_queue, diagram_id)

                # 비동기적으로 도식화 생성 작업 예약
                asyncio.create_task(self.create_diagram_async(
                    project_id=project_id,
                    api_id=api_id,
                    user_chat_data=user_chat_data,
                    diagram_id=diagram_id
                ))

                status = PromptResponseEnum.MODIFIED
                message_suffix = f"\n\n다이어그램을 생성하고 있습니다. 생성된 다이어그램 ID: {diagram_id}"
                message = message + message_suffix if not message.endswith(message_suffix) else message
            else:
                self.logger.info("AI가 도식화 생성이 필요하지 않다고 판단했습니다.")
                status = PromptResponseEnum.EXPLANATION

            # SystemChat 객체 생성
            version_info = None
            if diagram_id:
                version_info = VersionInfo(
                    newVersionId=diagram_id,
                    description=f"Updated diagram with {user_chat_data.tag} operation"
                )

            import uuid
            system_chat = SystemChat(
                systemChatId=str(uuid.uuid4()),
                status=status,
                message=message,
                versionInfo=version_info,
                diagramId=diagram_id
            )

            # Chat 객체 생성 및 저장
            chat = Chat(
                chatId=str(uuid.uuid4()),
                projectId=project_id,
                apiId=api_id,
                userChat=user_chat,
                systemChat=system_chat,
                createdAt=datetime.now()
            )

            # MongoDB에 채팅 저장
            self.logger.info(f"채팅 MongoDB에 저장 중: chatId={chat.chatId}")
            inserted_id = await self.chat_repository.insert_one(chat)
            self.logger.info(f"채팅 저장 완료: id={inserted_id}")

            # 응답 전송
            await self.sse_service.send_data(response_queue, {"message": message})

            # 스트리밍 종료
            await self.sse_service.close_stream(response_queue)
            self.logger.info("SSE 스트림 종료")

            return {
                "success": True,
                "generate_diagram": should_generate,
                "diagram_id": diagram_id
            }

        except Exception as e:
            self.logger.error(f"채팅 및 다이어그램 처리 중 오류 발생: {str(e)}", exc_info=True)

            # 오류 정보도 채팅으로 저장
            try:
                # UserChat 객체 생성
                user_chat = UserChat(
                    tag=user_chat_data.tag,
                    promptType=user_chat_data.promptType,
                    message=user_chat_data.message,
                    targetMethods=user_chat_data.targetMethods
                )
                import uuid
                # 오류 발생 시 SystemChat
                system_chat = SystemChat(
                    systemChatId=str(uuid.uuid4()),
                    status=PromptResponseEnum.ERROR,
                    message=f"처리 중 오류가 발생했습니다: {str(e)}",
                    diagramId=None
                )

                # Chat 객체 생성 및 저장
                chat = Chat(
                    chatId=str(uuid.uuid4()),
                    projectId=project_id,
                    apiId=api_id,
                    userChat=user_chat,
                    systemChat=system_chat,
                    createdAt=datetime.now()
                )

                # MongoDB에 오류 채팅 저장
                self.logger.info(f"오류 채팅 MongoDB에 저장 중: chatId={chat.chatId}")
                await self.chat_repository.insert_one(chat)
                self.logger.info(f"오류 채팅 저장 완료")
            except Exception as chat_save_error:
                self.logger.error(f"오류 채팅 저장 중 추가 오류 발생: {str(chat_save_error)}", exc_info=True)

            # 오류 응답 전송
            await self.sse_service.send_error(response_queue, f"처리 중 오류가 발생했습니다: {str(e)}")
            await self.sse_service.close_stream(response_queue)
            return {"success": False, "error": str(e)}

    async def get_prompts(self, project_id: str, api_id: str) -> ChatResponseList:
        """
        특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            ChatResponseList: 채팅 기록 목록
        """
        try:
            self.logger.info(f"채팅 기록 조회 시작: project_id={project_id}, api_id={api_id}")

            # 채팅 저장소를 통해 채팅 기록 조회
            chats = await self.chat_repository.get_prompts(project_id, api_id)
            self.logger.info(f"{len(chats)}개의 채팅 기록을 조회했습니다")

            # 조회된 채팅을 DTO로 변환
            chat_responses = []
            for chat in chats:
                # Chat 모델을 ChatResponse DTO로 변환
                chat_response = ChatResponse(
                    id=chat.id,
                    chatId=chat.chatId,
                    createdAt=chat.createdAt,
                    userChat=ChatResponse.UserChatResponse(**chat.userChat.model_dump()) if chat.userChat else None,
                    systemChat=ChatResponse.SystemChatResponse(**chat.systemChat.model_dump()) if chat.systemChat else None
                )
                chat_responses.append(chat_response)

            # ChatResponseList로 래핑하여 반환
            response = ChatResponseList(content=chat_responses)
            self.logger.info(f"채팅 기록 조회 완료: {len(response.content)}개의 채팅")

            return response

        except Exception as e:
            self.logger.error(f"채팅 기록 조회 중 오류 발생: {str(e)}", exc_info=True)
            raise
