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
from app.core.generator.chat_request_evaluator import PropositionAnalysis
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
            await self.diagram_repository.create_new_version(
                diagram=diagram
            )

            self.logger.info(f"비동기 도식화 생성 완료: diagram_id={diagram_id}")
        except Exception as e:
            self.logger.error(f"비동기 도식화 생성 중 오류 발생: {str(e)}", exc_info=True)

    async def process_chat_and_diagram(
            self, project_id: str, api_id: str, user_chat_data: UserChatRequest, response_queue: asyncio.Queue
    ) -> Dict:
        """
          1. 모든 경우에 Chat 저장:
            - 도식화가 필요한 경우든 일반 질문인 경우든 관계없이 모든 사용자 요청과 시스템 응답은 Chat 객체로 MongoDB에 저장됩니다.
            - 각 Chat 객체는 UserChat(사용자 요청)과 SystemChat(시스템 응답) 두 부분을 모두 포함합니다.
          2. 도식화가 필요한 경우:
            - Agent가 요청을 분석하여 MethodPromptTagEnum을 기반으로 도식화 생성이 필요하다고 판단합니다.
            - 우선 SSE로 "created" 이벤트와 함께 생성된 diagramId를 클라이언트에게 전달합니다.
            - 그 후 비동기적으로 도식화를 생성합니다.
            - 이 경우의 Chat 저장:
                - UserChat에는 사용자의 원래 요청 정보가 저장됩니다 (tag, promptType, message, targetMethods 등).
              - SystemChat에는 시스템의 응답과 함께 생성된 도식화의 ID(diagramId)와 관련 정보가 저장됩니다.
          3. 도식화가 필요하지 않은 경우:
            - 단순 질문/응답 형태로 처리됩니다.
            - 이 경우에도 Chat 저장:
                - UserChat에는 사용자의 요청 정보가 저장됩니다.
              - SystemChat에는 시스템의 텍스트 응답만 저장되며, 도식화 관련 정보는 포함되지 않습니다(diagramId는 null).


        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat_data: 사용자 채팅 데이터
            response_queue: 응답 데이터를 전송할 큐

        Returns:
            Dict: 응답 정보 (도식화 생성 여부, 도식화 ID 등)
        """
        self.logger.info(f"채팅 및 다이어그램 처리 시작: project_id={project_id}, api_id={api_id}")
        self.setup_llm_and_parser(response_queue)
        try:
            # 최신 다이어그램 조회 (가장 높은 버전)
            all_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id,
            }, sort=[("metadata.version", -1)])
            
            latest_diagram = all_diagrams[0] if all_diagrams else None

            if not latest_diagram:
                self.logger.error(f"다이어그램을 찾을 수 없습니다: project_id={project_id}, api_id={api_id}")
                await self.sse_service.send_error(response_queue, "다이어그램을 찾을 수 없습니다.")
                await self.sse_service.close_stream(response_queue)
                return {"error": "다이어그램을 찾을 수 없습니다"}

            target_method_details = await self._get_method_details(latest_diagram, user_chat_data)

            # Agent에게 도식화 생성 여부를 판단하도록 요청
            agent_input = {
                "tag": user_chat_data.tag.value,
                "promptType": user_chat_data.promptType.value,
                "message": user_chat_data.message,
                "targetMethods": target_method_details
            }

            # Agent 설정
            from app.core.generator.chat_request_evaluator import ChatRequestEvaulator
            evaluator: ChatRequestEvaulator = ChatRequestEvaulator()
            result: PropositionAnalysis = evaluator.validate(agent_input.__str__())

            self.logger.info(f"Agent에게 도식화 생성 여부 판단 요청: {agent_input}")
            
            # Agent의 결과에서 도식화 생성 여부 추출
            # should_generate_diagram = result.is_true
            should_generate_diagram = True
            self.logger.info(f"Agent에게 도식화 생성 여부 판단 결과: {should_generate_diagram}")
            self.logger.info(f"Agent에게 도식화 생성 여부 판단 이유: {result.reasoning}")

            # UUID 생성 (chatId)
            import uuid
            chat_id = str(uuid.uuid4())

            # UserChat 객체 생성
            user_chat = UserChat(
                tag=user_chat_data.tag,
                promptType=user_chat_data.promptType,
                message=user_chat_data.message,
                targetMethods=user_chat_data.targetMethods
            )
            
            # 도식화가 필요한 경우와 불필요한 경우의 분기 처리
            if should_generate_diagram:
                self.logger.info("도식화 생성이 필요하다고 판단됨")

                # 다이어그램 ID 생성
                diagram_id = str(uuid.uuid4())
                event = f"data: {json.dumps({
                    'token': {'diagramId': diagram_id},
                })}\n\n"
                self.logger.info(f"생성 이벤트 발송: {event}")

                # 답변을 생성하여 클라이언트에 전송
                response_content = await self.llm.ainvoke(
                    f"다음 내용을 검토해주세요. 수정사항이 있으면 수정해주세요. {agent_input.__str__()} 유저 메시지: {user_chat_data.message}"
                )

                # 비동기로 도식화 생성 작업 시작
                asyncio.create_task(self.create_diagram_async(
                    project_id=project_id,
                    api_id=api_id,
                    user_chat_data=user_chat_data,
                    diagram_id=diagram_id
                ))

                # SystemChat 생성 (도식화 ID 포함)
                version_info = VersionInfo(
                    newVersionId=latest_diagram.metadata.version + 1,
                    description="생성된 버전"
                )

                system_chat = SystemChat(
                    systemChatId=str(uuid.uuid4()),
                    status=PromptResponseEnum.MODIFIED,
                    message=response_content.content,
                    versionInfo=version_info,
                    diagramId=diagram_id
                )

                response_queue.put_nowait(event)
                # 클라이언트에게 최종 응답 전송
                await self.sse_service.close_stream(response_queue)

                
                # 저장할 데이터와 응답 데이터 준비
                response = {
                    "shouldGenerateDiagram": True,
                    "diagramId": diagram_id,
                    "message": response_content
                }
            else:
                self.logger.info("도식화 생성이 필요하지 않다고 판단됨")
                
                # 실제 응답 생성을 위한 Agent 실행
                response_content = await self.llm.ainvoke(
                    f"다음 내용을 검토해주세요. 수정사항이 있으면 수정해주세요. {agent_input.__str__()} 유저 메시지: {user_chat_data.message}"
                )
                
                response_content = response_content.content
                
                # SystemChat 생성 (도식화 ID 없음)
                system_chat = SystemChat(
                    systemChatId=str(uuid.uuid4()),
                    status=PromptResponseEnum.EXPLANATION,
                    message=response_content,
                    diagramId=None
                )
                
                # 클라이언트에게 응답 전송
                await self.sse_service.close_stream(response_queue)
                
                # 응답 데이터 준비
                response = {
                    "shouldGenerateDiagram": False,
                    "diagramId": None,
                    "message": response_content
                }
            
            # Chat 객체 생성 및 MongoDB에 저장
            chat = Chat(
                chatId=chat_id,
                projectId=project_id,
                apiId=api_id,
                userChat=user_chat,
                systemChat=system_chat,
                createdAt=datetime.now()
            )
            
            # MongoDB에 채팅 저장
            self.logger.info(f"채팅 저장 중: chatId={chat_id}")
            await self.chat_repository.insert_one(chat)
            self.logger.info(f"채팅 저장 완료: chatId={chat_id}")
            
            return response
            
        except Exception as e:
            self.logger.error(f"채팅 및 다이어그램 처리 중 오류 발생: {str(e)}", exc_info=True)
            
            # 오류 발생 시 클라이언트에게 알림
            await self.sse_service.send_error(response_queue, f"처리 중 오류가 발생했습니다: {str(e)}")
            await self.sse_service.close_stream(response_queue)
            
            return {"error": str(e)}

    async def _get_method_details(self, latest_diagram, user_chat_data):
        # 타겟 메서드들의 본문을 수집
        target_method_details = []
        for method_info in user_chat_data.targetMethods:
            method_id = method_info.get("methodId", "")
            if not method_id:
                continue

            # 다이어그램에서 해당 메서드 찾기
            method_body = None
            method_signature = None
            component_name = None

            for component in latest_diagram.components:
                for method in component.methods:
                    if method.methodId == method_id:
                        method_body = method.body
                        method_signature = method.signature
                        component_name = component.name
                        break
                if method_body:  # 이미 메서드를 찾은 경우 반복 중단
                    break

            target_method_details.append({
                "methodId": method_id,
                "componentName": component_name,
                "signature": method_signature,
                "body": method_body
            })
        return target_method_details

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
