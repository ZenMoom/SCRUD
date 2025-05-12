import asyncio
import logging
from typing import Optional, Tuple, Any
from datetime import datetime

from langchain.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage
import json

from app.api.dto.diagram_dto import UserChatRequest, DiagramResponse, ChatResponse, ChatResponseList
from app.core.generator.model_generator import ModelGenerator
from app.core.prompts.few_shot_prompt_template import DiagramPromptGenerator
from app.core.services.sse_service import SSEService
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, MethodPromptTagEnum, \
    MethodPromptTargetEnum


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
        response_queue: Optional[asyncio.Queue] = None,
        project_id: str = None,
        api_id: str = None
    ) -> DiagramResponse:
        """
        LLM을 사용하여 OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 메서드

        Args:
            user_chat_data (UserChatRequest): 사용자 채팅 요청 데이터
            response_queue (asyncio.Queue, optional): 실시간 응답을 위한 비동기 큐 (None이면 스트리밍 모드 비활성화)
            project_id (str, optional): 프로젝트 ID
            api_id (str, optional): API ID

        Returns:
            DiagramResponse: 생성된 도식화 데이터
        """
        self.logger.info(f"prompt_diagram_from_openapi 메서드 시작: project_id={project_id}, api_id={api_id}")
        self.logger.info(f"User request: tag={user_chat_data.tag}, promptType={user_chat_data.promptType}")
        self.logger.info(f"Target methods count: {len(user_chat_data.targetMethods)}")

        # 스트리밍 모드 확인
        use_streaming = response_queue is not None
        self.logger.info(f"스트리밍 모드: {use_streaming}")
        try:
            # 기존 다이어그램 조회 (가장 높은 버전)
            self.logger.info(f"기존 다이어그램 조회 중: project_id={project_id}, api_id={api_id}")
            all_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if latest_diagram:
                self.logger.info(f"최신 다이어그램 조회 성공: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")
            else:
                error_msg = f"다이어그램을 찾을 수 없습니다: project_id={project_id}, api_id={api_id}"
                self.logger.error(error_msg)
                raise ValueError(error_msg)

            # LLM 및 파서 설정
            self.logger.info(f"LLM 및 파서 설정 시작: model_name={self.model_name}")
            if use_streaming:
                # 스트리밍 모드 LLM 설정
                self.llm, self.parser = self.setup_llm_and_parser(response_queue)
            else:
                # 비스트리밍 모드 LLM 설정
                self.llm = self.model_generator.get_chat_model(self.model_name)
                self.parser = PydanticOutputParser(pydantic_object=Diagram)

            self.logger.info(f"LLM 및 파서 설정 완료")

            # 프롬프트 생성
            self.logger.info("프롬프트 생성 시작")

            # PromptType에 따른 프롬프트 조정
            if user_chat_data.promptType == MethodPromptTargetEnum.SIGNATURE:
                self.logger.info("SIGNATURE 모드: 모든 메서드 시그니처 업데이트")
                prompt_type_instruction = "모든 메서드의 시그니처를 새롭게 작성해주세요."
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

            # datetime 객체를 문자열로 변환하는 사용자 정의 JSON 인코더
            class DateTimeEncoder(json.JSONEncoder):
                def default(self, obj):
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
            if use_streaming:
                # 스트리밍 모드 호출
                response = await self.llm.ainvoke(
                    [
                        HumanMessage(content=complete_prompt),
                        HumanMessage(content=self.parser.get_format_instructions()),
                    ]
                )
            else:
                # 비스트리밍 모드 호출
                response = await asyncio.to_thread(
                    self.llm.invoke,
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

            # 스트리밍 모드인 경우에만 에러 응답 전송
            if use_streaming and response_queue:
                await self.sse_service.send_error(response_queue, f"처리 중 오류가 발생했습니다: {str(e)}")
                await self.sse_service.close_stream(response_queue)

            raise

    async def process_chat_and_diagram(
            self, project_id: str, api_id: str, user_chat_data: UserChatRequest, response_queue: asyncio.Queue
    ) -> DiagramResponse:
        """
        채팅 요청을 처리하고 필요한 경우 다이어그램을 업데이트하는 백그라운드 태스크

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat_data: 사용자 채팅 데이터
            response_queue: 응답 데이터를 전송할 큐

        Returns:
            Diagram: 생성 또는 업데이트된 다이어그램
        """
        self.logger.info(f"채팅 및 다이어그램 처리 시작: project_id={project_id}, api_id={api_id}")

        try:
            # 최신 다이어그램 조회 (가장 높은 버전)
            all_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if latest_diagram:
                self.logger.info(
                    f"최신 다이어그램 조회: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")
            else:
                self.logger.info("기존 다이어그램이 없음. 첫 다이어그램 생성 필요")

            # 사용자 채팅에 따라 다이어그램 생성 또는 수정
            self.logger.info("다이어그램 생성/수정 처리 중")

            # 실제 다이어그램 생성 로직 실행
            diagram = await self.prompt_diagram_from_openapi(
                user_chat_data,
                response_queue,
                project_id=project_id,
                api_id=api_id
            )

            # 스트리밍 종료
            await self.sse_service.close_stream(response_queue)
            self.logger.info("SSE 스트림 종료")

            return diagram

        except Exception as e:
            self.logger.error(f"채팅 및 다이어그램 처리 중 오류 발생: {str(e)}", exc_info=True)
            # 오류 응답 전송
            await self.sse_service.send_error(response_queue, f"처리 중 오류가 발생했습니다: {str(e)}")
            await self.sse_service.close_stream(response_queue)
            raise

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
                    userChat=ChatResponse.UserChatResponse(**chat.userChat.dict()) if chat.userChat else None,
                    systemChat=ChatResponse.SystemChatResponse(**chat.systemChat.dict()) if chat.systemChat else None
                )
                chat_responses.append(chat_response)

            # ChatResponseList로 래핑하여 반환
            response = ChatResponseList(content=chat_responses)
            self.logger.info(f"채팅 기록 조회 완료: {len(response.content)}개의 채팅")

            return response

        except Exception as e:
            self.logger.error(f"채팅 기록 조회 중 오류 발생: {str(e)}", exc_info=True)
            raise
