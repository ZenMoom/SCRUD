import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Tuple, Any, Dict, Coroutine, List

from langchain.output_parsers import PydanticOutputParser
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph_sdk.auth.exceptions import HTTPException

from app.api.dto.diagram_dto import UserChatRequest, DiagramResponse, ChatResponse, ChatResponseList
from app.core.generator.chat_request_evaluator import PropositionAnalysis
from app.core.generator.model_generator import ModelGenerator
from app.core.services.sse_service import SSEService
from app.infrastructure.http.client.api_client import ApiSpec, GlobalFileList
from app.infrastructure.mongodb.repository.chat_repository import ChatRepository
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, UserChat, SystemChat, Chat, VersionInfo, \
    PromptResponseEnum, Method


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
        self.logger = logging.getLogger(__name__)

    async def _create_diagram(
            self,
            project_id: str,
            api_id: str,
            user_chat_data: UserChatRequest,
            diagram_id: str,
            diagram_code: str,
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

            latest_diagram: Diagram = all_diagrams[0] if all_diagrams else None

            if not latest_diagram:
                self.logger.error("기존 다이어그램이 없어 도식화를 생성할 수 없습니다.")
                return

            # 도식화 생성 로직 실행
            from app.core.generator.diagram_generator import DiagramProcessor
            diagram = DiagramProcessor(
                logger=self.logger,
                parser=self.parser,
            )

            generated_diagram = await diagram.generate_diagram_data(
                user_chat_data=user_chat_data,
                latest_diagram=latest_diagram,
                project_id=project_id,
                api_id=api_id,
                diagram_code=diagram_code
            )

            # 생성된 도식화의 ID를 지정된 ID로 업데이트
            generated_diagram.diagramId = diagram_id

            # MongoDB에 저장
            await self.diagram_repository.create_new_version(
                diagram=self._convert_diagram_response_to_diagram(generated_diagram),
            )

            self.logger.info(f"비동기 도식화 생성 완료: diagram_id={diagram_id}")
        except Exception as e:
            self.logger.error(f"비동기 도식화 생성 중 오류 발생: {str(e)}", exc_info=True)

    async def process_chat_and_diagram(
            self,
            project_id: str,
            api_id: str,
            user_chat_data: UserChatRequest,
            api_spec: ApiSpec,
            global_files: GlobalFileList,
            response_queue: asyncio.Queue
    ) -> None:
        """
        채팅을 처리하고 필요한 경우 다이어그램을 생성하는 함수

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat_data: 사용자 채팅 데이터
            response_queue: 응답 데이터를 전송할 큐
            api_spec
            global_files
        Returns:
            Dict: 응답 정보 (도식화 생성 여부, 도식화 ID 등)
        """
        self.logger.info("=" * 80)
        self.logger.info("채팅 및 다이어그램 처리 시작")
        self.logger.info("-" * 80)

        # 각 파라미터 로깅
        self.logger.info(f"▶ 프로젝트 ID: {project_id}")
        self.logger.info(f"▶ API ID: {api_id}")
        self.logger.info(f"▶ 사용자 채팅 데이터:")
        self.logger.info(f"   └ \n{user_chat_data.model_dump_json(indent=2)}")
        self.logger.info(f"▶ API 스펙 정보: {api_spec.model_dump_json(indent=2)}")
        self.logger.info(f"▶ 글로벌 파일 개수: {len(global_files.content) if hasattr(global_files, 'content') else 0}개")
        self.logger.info(f"▶ 글로벌 파일: {global_files.model_dump_json(indent=2)}")
        self.logger.info("-" * 80)

        try:
            # 최신 다이어그램 조회
            latest_diagram: Diagram = await self._get_latest_diagram(
                project_id=project_id,
                api_id=api_id,
                user_chat_data=user_chat_data,
                response_queue=response_queue
            )
            self.logger.info(f"▶ 타겟 메서드 또는 최신 다이어그램 조회 ID: {latest_diagram.diagramId}, Version: {latest_diagram.metadata.version}")
            self.logger.info(f"▶ 타겟 메서드 또는 최신 다이어그램 조회 결과: {latest_diagram.model_dump_json(indent=2)}")

            # 메서드 상세 정보 및 다이어그램 생성 여부 평가
            target_method_details = await self._get_method_details(latest_diagram, user_chat_data)
            self.logger.info(f"▶ 타겟 메서드의 본문 내용 가져오기")
            self.logger.info(f"▶▶ {target_method_details} ")

            agent_input, should_generate_diagram = await self.evaluate_diagram_generate(
                target_method_details, user_chat_data
            )

            # 채팅 ID 생성 및 사용자 채팅 객체 생성
            chat_id = self._generate_uuid()
            user_chat = self._create_user_chat(user_chat_data)

            # LLM으로 응답 생성 및 채팅 처리
            response = await self._process_chat_response(
                project_id, api_id, chat_id, user_chat, user_chat_data,
                latest_diagram, agent_input, should_generate_diagram, response_queue, api_spec, global_files
            )


        except HTTPException as e:
            await self._handle_error(e, response_queue)

    async def _get_latest_diagram(
            self,
            project_id: str,
            api_id: str,
            user_chat_data: UserChatRequest,
            response_queue: asyncio.Queue
    ) -> Diagram:
        """최신 다이어그램을 조회하는 함수"""

        def _has_target_methods() -> bool:
            """타겟 메서드가 있는지 확인하는 함수"""
            return user_chat_data.targetMethods and len(user_chat_data.targetMethods) > 0

        async def _find_diagram_by_method_id() -> Diagram | None:
            """메서드 ID로 다이어그램을 조회하는 함수"""
            self.logger.info(f"methodId로 다이어그램 조회: methodId={method_id}")

            # MongoDB 쿼리를 사용해 methodId가 포함된 다이어그램 조회
            diagram_with_method = await self.diagram_repository.find_diagram_by_method_id(
                project_id=project_id,
                api_id=api_id,
                method_id=method_id
            )

            if diagram_with_method:
                self.logger.info(f"methodId={method_id}로 다이어그램을 찾았습니다. version={diagram_with_method.metadata.version}")
                return diagram_with_method

            # 다이어그램을 찾지 못한 경우 에러 처리
            await _handle_diagram_not_found(
                f"methodId={method_id}에 해당하는 다이어그램을 찾을 수 없습니다."
            )

        async def _find_latest_diagram() -> Diagram | None:
            """최신 다이어그램을 조회하는 함수"""
            latest_diagram = await self.diagram_repository.find_latest_by_project_api(project_id, api_id)

            if latest_diagram:
                return latest_diagram

            # 다이어그램을 찾지 못한 경우 에러 처리
            await _handle_diagram_not_found(
                f"다이어그램을 찾을 수 없습니다: project_id={project_id}, api_id={api_id}"
            )

        async def _handle_diagram_not_found(error_msg: str):
            """다이어그램을 찾지 못했을 때의 에러 처리 함수"""
            self.logger.error(error_msg)
            await self.sse_service.send_error(response_queue, "다이어그램을 찾을 수 없습니다.")
            await self.sse_service.close_stream(response_queue)

            # 404 에러 발생시키기
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=error_msg)

        self.logger.info(f"최신 다이어그램 조회: project_id={project_id}, api_id={api_id}")

        # 타겟 메서드가 있는 경우 처리
        if _has_target_methods():
            method_id = user_chat_data.targetMethods[0].get("methodId", "")
            if method_id:
                return await _find_diagram_by_method_id()

        # 최신 다이어그램 조회
        return await _find_latest_diagram()

    def _generate_uuid(self) -> str:
        """UUID를 생성하는 함수"""
        import uuid
        return str(uuid.uuid4())



    async def _send_diagram_event(self, diagram_id: str, response_queue: asyncio.Queue) -> None:
        """다이어그램 생성 이벤트를 전송하는 함수"""
        event = f"data: {json.dumps({'token': {'diagramId': diagram_id}})}\n\n"
        response_queue.put_nowait(event)
        self.logger.info(f"생성 이벤트 발송: {event}")

    async def _save_chat(self, chat_id: str, project_id: str, api_id: str, user_chat: UserChat,
                         system_chat: SystemChat) -> None:
        """Chat 객체를 생성하고 MongoDB에 저장하는 함수"""
        chat = Chat(
            chatId=chat_id,
            projectId=project_id,
            apiId=api_id,
            userChat=user_chat,
            systemChat=system_chat,
            createdAt=datetime.now()
        )

        self.logger.info(f"채팅 저장 중: chatId={chat_id}")
        await self.chat_repository.insert_one(chat)
        self.logger.info(f"채팅 저장 완료: chatId={chat_id}")




    def _convert_diagram_response_to_diagram(self, diagram_response: DiagramResponse) -> Diagram:
        """
        DiagramResponse DTO를 Diagram 모델로 변환하는 메서드
        
        Args:
            diagram_response: 변환할 DiagramResponse DTO
            
        Returns:
            Diagram: 변환된 Diagram 모델
        """
        diagram_response_json = diagram_response.model_dump_json()
        diagram = Diagram.model_validate_json(diagram_response_json)
        return diagram

    async def _get_method_details(self, latest_diagram, user_chat_data) -> List[Method]:
        target_method_details: List[Method] = []
        latest_diagram_methods = latest_diagram.components

        # user_chat_data의 targetMethods 리스트의 methodId와 일치하는 latest_diagram의 methods를 리턴하기
        for method_info in user_chat_data.targetMethods:
            method_id = method_info.get("methodId", "")
            if not method_id:
                continue

            for method in latest_diagram_methods:
                if method.methodId == method_id:
                    target_method_details.append(method)
                    break

        return target_method_details

    async def _get_method_details2(self, latest_diagram, user_chat_data):
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

    from fastapi import HTTPException
    async def _handle_error(self, exception: HTTPException, response_queue: asyncio.Queue) -> Dict:
        """에러를 처리하는 함수"""

        error_message = exception.detail
        status_code = exception.status_code
        self.logger.error(f"HTTP 오류 발생 ({status_code}): {error_message}", exc_info=True)

        # 이미 SSE 에러가 전송되었을 수 있으므로 스트림이 열려있는지 확인
        if not response_queue.empty():
            # 오류 발생 시 클라이언트에게 알림
            await self.sse_service.send_error(response_queue, f"오류 {status_code}: {error_message}")
            await self.sse_service.close_stream(response_queue)

        return {"error": error_message, "status_code": status_code}
