import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Tuple, Any, Dict

from langchain.output_parsers import PydanticOutputParser

from app.api.dto.diagram_dto import UserChatRequest, DiagramResponse, ChatResponse, ChatResponseList
from app.core.generator.chat_request_evaluator import PropositionAnalysis
from app.core.generator.model_generator import ModelGenerator
from app.core.services.sse_service import SSEService
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, UserChat, SystemChat, Chat, VersionInfo, \
    PromptResponseEnum, \
    Component, Method, Connection, DtoModel, Metadata, ComponentTypeEnum, MethodConnectionTypeEnum


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

    async def _create_diagram_async(
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

            # 도식화 생성 로직 실행
            from app.core.generator.diagram_generator import DiagramProcessor
            diagram = DiagramProcessor(
                logger=self.logger,
                parser=self.parser,
                diagram_repository=self.diagram_repository,
            )

            generated_diagram = await diagram.generate_diagram_data(
                user_chat_data=user_chat_data,
                latest_diagram=latest_diagram,
                project_id=project_id,
                api_id=api_id
            )

            # 생성된 도식화의 ID를 지정된 ID로 업데이트
            generated_diagram.diagramId = diagram_id

            # MongoDB에 저장
            await self.diagram_repository.create_new_version(
                diagram=self._convert_diagram_response_to_diagram(generated_diagram)
            )

            self.logger.info(f"비동기 도식화 생성 완료: diagram_id={diagram_id}")
        except Exception as e:
            self.logger.error(f"비동기 도식화 생성 중 오류 발생: {str(e)}", exc_info=True)

    async def process_chat_and_diagram(
            self, project_id: str, api_id: str, user_chat_data: UserChatRequest, response_queue: asyncio.Queue
    ) -> Dict:
        """
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
            should_generate_diagram = result.is_true
            # should_generate_diagram = True
            self.logger.info(f"Agent에게 도식화 생성 여부 판단 결과: {should_generate_diagram}")
            self.logger.info(f"Agent에게 도식화 생성 여부 판단 이유: {result.reasoning}")
            self.logger.info(f"==============================================================")

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


                event = f"data: {json.dumps({'token': {'diagramId': diagram_id}})}\n\n"
                response_queue.put_nowait(event)
                self.logger.info(f"생성 이벤트 발송: {event}")

                # 답변을 생성하여 클라이언트에 전송
                response_content = await self.llm.ainvoke(
                    f"다음 내용을 검토해주세요. 수정사항이 있으면 수정해주세요. {agent_input.__str__()} 유저 메시지: {user_chat_data.message}"
                )
                self.logger.info(f"생성된 응답 값: {response_content.content}")

                await self.sse_service.close_stream(response_queue)

                # 비동기로 도식화 생성 작업 시작
                asyncio.create_task(self._create_diagram_async(
                    project_id=project_id,
                    api_id=api_id,
                    user_chat_data=user_chat_data,
                    diagram_id=diagram_id
                ))

                # SystemChat 생성 (도식화 ID 포함)
                version_info = VersionInfo(
                    newVersionId=f"{latest_diagram.metadata.version + 1}",
                    description="생성된 버전"
                )

                system_chat = SystemChat(
                    systemChatId=str(uuid.uuid4()),
                    status=PromptResponseEnum.MODIFIED,
                    message=response_content.content,
                    versionInfo=version_info,
                    diagramId=diagram_id
                )
                
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
                self.logger.info(f"생성된 응답 값: {response_content.content}")
                await self.sse_service.close_stream(response_queue)

                response_content = response_content.content
                
                # SystemChat 생성 (도식화 ID 없음)
                system_chat = SystemChat(
                    systemChatId=str(uuid.uuid4()),
                    status=PromptResponseEnum.EXPLANATION,
                    message=response_content,
                    diagramId=None
                )
                
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

    def _convert_diagram_response_to_diagram(self, diagram_response: DiagramResponse) -> Diagram:
        """
        DiagramResponse DTO를 Diagram 모델로 변환하는 메서드
        
        Args:
            diagram_response: 변환할 DiagramResponse DTO
            
        Returns:
            Diagram: 변환된 Diagram 모델
        """
        diagram_response_json = diagram_response.model_dump_json()
        print(diagram_response_json)
        diagram = Diagram.model_validate_json(diagram_response_json)
        print(diagram)
        return diagram


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
