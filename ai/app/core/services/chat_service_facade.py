import asyncio
import logging
import uuid
from typing import List

from app.api.dto.diagram_dto import UserChatRequest, ChatResponseList
from app.core.diagram.component.component_service import ComponentService
from app.core.diagram.connection.connection_service import ConnectionService
from app.core.diagram.diagram_service import DiagramService
from app.core.llm.prompt_service import PromptService
from app.core.models.diagram_model import ComponentChainPayload, DtoModelChainPayload
from app.core.models.global_setting_model import ApiSpecChainPayload
from app.core.models.user_chat_model import SystemChatChainPayload
from app.core.services.chat_service import ChatService
from app.core.services.sse_service import SSEService
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram, Chat, VersionInfo


class ChatServiceFacade:
    """
    OpenAPI 명세로부터 도식화 데이터를 생성하고 MongoDB에 저장하는 서비스
    """

    def __init__(
            self,
            sse_service: SSEService = None,
            chat_service: ChatService = None,
            prompt_service: PromptService = None,
            diagram_service: DiagramService = None,
            component_service: ComponentService = None,
            connection_service: ConnectionService = None,

    ):
        """
        ChatService 초기화

        Args:
            sse_service (SSEService, optional): SSE 서비스
            logger (logging.Logger, optional): 로깅 객체
        """
        self.sse_service = sse_service
        self.chat_service = chat_service
        self.prompt_service = prompt_service
        self.diagram_service = diagram_service
        self._component_service = component_service
        self._connection_service = connection_service

        self.logger = logging.getLogger(__name__)

    async def get_prompts(self, project_id: str, api_id: str) -> ChatResponseList:
        """
        특정 프로젝트와 API의 모든 채팅 기록을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID

        Returns:
            ChatResponseList: 채팅 기록 목록
        """
        self.logger.info(f"[디버깅] ChatServiceFacade - get_prompts 메소드 시작: project_id={project_id}, api_id={api_id}")
        result = await self.chat_service.get_prompts(project_id, api_id)
        self.logger.info(f"[디버깅] ChatServiceFacade - get_prompts 메소드 완료: 채팅 개수={len(result.chats) if hasattr(result, 'chats') else 0}")
        return result

    ######################################################################################################

    async def create_chat(
            self,
            project_id: str,
            api_id: str,
            chat_request: UserChatRequest,
            global_files: GlobalFileList,
            api_spec: ApiSpec,
            queue: asyncio.Queue
    ) -> Chat:
        """
        채팅 생성 및 응답
        user_chat 의 각종 태그를 확인해서 다이어그램을 생성할 지 안할지를 결정해야함
            "tag": "REFACTORING",
            "promptType": "BODY",
            "message": "선택한 메서드를 리팩토링",
            "targetMethods": 메서드 본문

        api_spec, global_files 도 넣어줘야한다.

        응답 값
            다이어그램 생성 여부
            다이어그램 생성 이유
            생성된 코드
            다이어그램을 생성한다고 결정되는 경우
            코드를 생성하고

        다이어그램을 확인하고 채팅을 저장
            다이어그램이 없으면 newVersionId는 갱신되지않음
            다이어그램이 있으면 newVersionId는 갱신된다.
        """
        self.logger.info("=" * 80)
        self.logger.info("[디버깅] ChatServiceFacade - create_chat 메소드 시작")
        self.logger.info("채팅 및 다이어그램 처리 시작")
        self.logger.info("-" * 80)

        # 각 파라미터 로깅
        self.logger.info(f"▶ 프로젝트 ID: {project_id}")
        self.logger.info(f"▶ API ID: {api_id}")
        self.logger.info(f"▶ 사용자 채팅 데이터:")
        self.logger.info(f"   └ 메시지: {chat_request.message[:100]}{'...' if len(chat_request.message) > 100 else ''}")
        self.logger.info(f"   └ 태그: {chat_request.tag}, 프롬프트 타입: {chat_request.promptType}")
        
        # API 스펙 정보는 크기가 클 수 있으므로 핵심 정보만 로깅

        # 글로벌 파일 정보도 간략히 로깅
        self.logger.info(f"▶ 글로벌 파일 개수: {len(global_files.files) if hasattr(global_files, 'files') else 0}개")
        file_names = [f.file_name[:30] for f in global_files.files[:3]] if hasattr(global_files, 'files') else []
        if len(file_names) > 0:
            self.logger.info(f"▶ 글로벌 파일 샘플: {', '.join(file_names)}{' 외 더 많은 파일...' if len(global_files.files) > 3 else ''}")
        self.logger.info("-" * 80)

        target_diagram = None
        # 스트리밍 핸들러 설정
        self.prompt_service.set_streaming_handler(queue)
        self.logger.info("[디버깅] ChatServiceFacade - 스트리밍 핸들러 설정 완료")

        # 1. 최신 다이어그램 조회
        self.logger.info("[디버깅] ChatServiceFacade - 다이어그램 조회 시작")
        try:
            target_diagram = await self.chat_service.get_target_diagram(
                project_id=project_id,
                api_id=api_id,
                user_chat_data=chat_request,
            )
            if target_diagram:
                self.logger.info(f"[디버깅] ChatServiceFacade - 다이어그램 조회 성공: 버전 {target_diagram.metadata.version if hasattr(target_diagram, 'metadata') else 'N/A'}")
            else:
                self.logger.info("[디버깅] ChatServiceFacade - 다이어그램 조회 결과 없음")
        except Exception as e:
            self.logger.error(f"[디버깅] ChatServiceFacade - 다이어그램 조회 중 오류 발생: {str(e)}")
            await self.sse_service.close_stream(queue)

        # 2. 요청/글로벌 데이터 준비
        version_id = None
        diagram_id: str = str(uuid.uuid4())
        self.logger.info(f"[디버깅] ChatServiceFacade - 새 다이어그램 ID 생성: {diagram_id}")

        # 채팅 흐름 처리
        self.logger.info("[디버깅] ChatServiceFacade - 채팅 흐름 처리 시작")
        system_chat_payload: SystemChatChainPayload = await self.prompt_service.process_chat_flow(
            chat_data=chat_request,
            global_files=global_files,
            diagram=target_diagram
        )
        self.logger.info(f"[디버깅] ChatServiceFacade - 채팅 흐름 처리 완료: 상태={system_chat_payload.status}")
        self.logger.info("[디버깅] ChatServiceFacade - 다이어그램 ID 이벤트 전송 완료")

        # 4. 다이어그램 필요 여부 판단
        self.logger.info(f"[디버깅] ChatServiceFacade - 다이어그램 필요 여부 판단: {system_chat_payload.status}")
        if system_chat_payload.status in {
            SystemChatChainPayload.PromptResponseEnum.MODIFIED,
            SystemChatChainPayload.PromptResponseEnum.MODIFIED_WITH_NEW_COMPONENTS
        }:
            self.logger.info("[디버깅] ChatServiceFacade - 다이어그램 생성 시작")
            
            self.logger.info("[디버깅] ChatServiceFacade - 컴포넌트 생성 시작")
            components: List[ComponentChainPayload] = await self._component_service.create_components_with_system_chat(
                system_chat_payload)
            self.logger.info(f"[디버깅] ChatServiceFacade - 컴포넌트 생성 완료: {len(components)}개")
            
            self.logger.info("[디버깅] ChatServiceFacade - DTO 생성 시작")
            dtos: List[DtoModelChainPayload] = await self._component_service.create_dtos_with_api_spec(
                api_spec=ApiSpecChainPayload.model_validate(api_spec.model_dump())
            )
            self.logger.info(f"[디버깅] ChatServiceFacade - DTO 생성 완료: {len(dtos)}개")
            
            self.logger.info("[디버깅] ChatServiceFacade - 커넥션 생성 시작")
            connections = await self._connection_service.create_connection_with_prompt(components)
            self.logger.info(f"[디버깅] ChatServiceFacade - 커넥션 생성 완료: {len(connections)}개")

            self.logger.info("[디버깅] ChatServiceFacade - 다이어그램 저장 시작")
            diagram: Diagram = await self.diagram_service.create_diagram_from_prompt_result(
                project_id=project_id,
                api_id=api_id,
                diagram_id=diagram_id,
                components=components,
                dtos=dtos,
                connections=connections
            )
            self.logger.info(f"[디버깅] ChatServiceFacade - 다이어그램 저장 완료: 버전 {diagram.metadata.version}")

            version_id = str(diagram.metadata.version)
            version_info: VersionInfo = VersionInfo(
                newVersionId=version_id,
                description="다이어그램을 새로 생성했기 때문에 버전 업"
            )
            self.logger.info(f"[디버깅] ChatServiceFacade - 버전 정보 생성: 새 버전 ID={version_info.newVersionId}")
        else:
            version_id = str(target_diagram.metadata.version)
            version_info: VersionInfo = VersionInfo(
                newVersionId=str(target_diagram.metadata.version),
                description="버전 유지"
            )
            self.logger.info(f"[디버깅] ChatServiceFacade - 버전 유지: 버전 ID={version_info.newVersionId}")

        self.logger.info("[디버깅] ChatServiceFacade - 버전 이벤트 전송")
        await self.sse_service.send_version_event(
            version_id=version_id,
            response_queue=queue
        )
        # 6. Chat 엔티티 조립 및 저장
        self.logger.info("[디버깅] ChatServiceFacade - 채팅 엔티티 조립 시작")
        self.logger.info("[디버깅] ChatServiceFacade - 채팅 엔티티 조립 시작")
        chat_entity: Chat = self.chat_service.assemble_chat_entity(
            project_id=project_id,
            api_id=api_id,
            diagram_id=diagram_id,
            chat_request=chat_request,
            version_info=version_info,
            system_chat_payload=system_chat_payload,
        )
        self.logger.info(f"[디버깅] ChatServiceFacade - 채팅 엔티티 조립 완료: ID={chat_entity.chatId}")

        self.logger.info("[디버깅] ChatServiceFacade - 채팅 저장 시작")
        saved = await self.chat_service.save_chat(chat_entity)
        self.logger.info("[디버깅] ChatServiceFacade - 채팅 저장 완료")
        
        self.logger.info("[디버깅] ChatServiceFacade - SSE 스트림 종료")
        await self.sse_service.close_stream(response_queue=queue)
        self.logger.info("[디버깅] ChatServiceFacade - create_chat 메소드 완료")

        return saved
