from typing import Dict, List, Any, Optional, Type
import uuid
import logging
from datetime import datetime
from copy import deepcopy

from app.infrastructure.mongodb.repository.mongo_repository_impl import MongoRepositoryImpl
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import (
    Diagram, Component, Metadata, Chat, UserChat, SystemChat, VersionInfo,
    PromptResponseEnum
)

# 로깅 설정
logger = logging.getLogger(__name__)


class DiagramRepositoryImpl(MongoRepositoryImpl[Diagram], DiagramRepository):
    """
    Diagram 문서를 MongoDB에서 관리하는 저장소 구현 클래스
    """
    
    def __init__(self):
        """
        DiagramRepositoryImpl 초기화
        """
        super().__init__("diagrams", Diagram)
        self.chat_collection_name = "chats"
    
    async def get_diagram_by_version(self, project_id: str, api_id: str, version_id: str) -> Optional[Diagram]:
        """
        특정 프로젝트와 API의 특정 버전 다이어그램을 조회합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version_id: 버전 ID (metadata.version 값)

        Returns:
            찾은 Diagram 객체 또는 None
        """
        try:
            logger.info(f"다이어그램 조회 시작: project_id={project_id}, api_id={api_id}, version_id={version_id}")

            # 버전 ID가 숫자이면 해당 버전 번호로 조회
            if version_id.isdigit():
                version = int(version_id)
                logger.info(f"숫자 버전으로 다이어그램 조회: version={version}")
                diagram = await self.find_one({
                    "projectId": project_id,
                    "apiId": api_id,
                    "metadata.version": version
                })
            # 아니면 특정 버전 ID로 조회
            else:
                logger.info(f"다이어그램 ID로 조회: diagramId={version_id}")
                diagram = await self.find_one({
                    "projectId": project_id,
                    "apiId": api_id,
                    "diagramId": version_id
                })

            if diagram:
                logger.info(f"다이어그램 조회 성공: diagramId={diagram.diagramId}, version={diagram.metadata.version}")
            else:
                logger.warning(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}, version_id={version_id}")

            return diagram

        except Exception as e:
            # 오류 발생 시 None 반환
            logger.error(f"다이어그램 조회 중 오류 발생: {str(e)}", exc_info=True)
            return None
    
    async def update_component_position(self, project_id: str, api_id: str, component_id: str,
                                    position_x: float, position_y: float) -> Optional[Component]:
        """
        다이어그램에서 특정 컴포넌트의 위치를 업데이트합니다.
        위치 변경은 버전을 증가시키지 않습니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            component_id: 컴포넌트 ID
            position_x: 새 X 좌표
            position_y: 새 Y 좌표

        Returns:
            업데이트된 Component 객체 또는 None
        """
        logger.info(f"컴포넌트 위치 업데이트 시작: project_id={project_id}, api_id={api_id}, component_id={component_id}, x={position_x}, y={position_y}")

        try:
            # 최신 버전의 다이어그램 조회
            all_diagrams = await self.find_many({
                "projectId": project_id,
                "apiId": api_id
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if not latest_diagram:
                logger.warning(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}")
                return None

            logger.info(f"최신 다이어그램 조회: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")

            # 다이어그램에서 해당 컴포넌트 찾기
            updated_component = None
            component_found = False

            for i, component in enumerate(latest_diagram.components):
                if component.componentId == component_id:
                    component_found = True
                    logger.info(f"컴포넌트 찾음: name={component.name}, 현재 위치: x={component.positionX}, y={component.positionY}")

                    # 컴포넌트 위치 업데이트
                    update_result = await self.update_one(
                        {"projectId": project_id, "apiId": api_id, "diagramId": latest_diagram.diagramId,
                        "components.componentId": component_id},
                        {"$set": {
                            "components.$.positionX": position_x,
                            "components.$.positionY": position_y
                        }}
                    )

                    if update_result:
                        logger.info(f"컴포넌트 위치 업데이트 성공: x={position_x}, y={position_y}")
                        # 업데이트된 컴포넌트 반환
                        updated_component = component
                        updated_component.positionX = position_x
                        updated_component.positionY = position_y
                        return updated_component
                    else:
                        logger.warning("컴포넌트 위치 업데이트 실패")

            if not component_found:
                logger.warning(f"컴포넌트를 찾을 수 없음: component_id={component_id}")

            return None
        except Exception as e:
            logger.error(f"컴포넌트 위치 업데이트 중 오류 발생: {str(e)}", exc_info=True)
            return None
    
    async def create_chat_and_diagram(self, project_id: str, api_id: str, user_chat: Dict[str, Any],
                                  system_chat: Dict[str, Any], diagram: Diagram = None) -> str:
        """
        채팅 요청 및 응답과 함께 새 버전의 다이어그램을 생성하고 저장합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            user_chat: 사용자 채팅 데이터
            system_chat: 시스템 채팅 응답 데이터
            diagram: 새로 생성된 다이어그램 데이터 (None인 경우 새 버전 생성)

        Returns:
            생성된 채팅 ID
        """
        logger.info(f"채팅 및 다이어그램 생성 시작: project_id={project_id}, api_id={api_id}")
        logger.debug(f"user_chat 데이터: {user_chat}")
        logger.debug(f"system_chat 데이터: {system_chat}")

        try:
            chat_collection = await self._get_collection(self.chat_collection_name)

            # 최신 버전의 다이어그램 조회
            all_diagrams = await self.find_many({
                "projectId": project_id,
                "apiId": api_id
            }, sort=[("metadata.version", -1)])

            latest_diagram = all_diagrams[0] if all_diagrams else None

            if latest_diagram:
                logger.info(f"최신 다이어그램 조회: diagramId={latest_diagram.diagramId}, version={latest_diagram.metadata.version}")
            else:
                logger.info("기존 다이어그램이 없음. 새 다이어그램 생성 필요")

            # 새 다이어그램이 제공되지 않았다면 최신 버전에서 복사하여 새 버전 생성
            if not diagram and latest_diagram:
                logger.info("기존 다이어그램 기반으로 새 버전 생성")
                diagram = deepcopy(latest_diagram)

                # 버전 증가
                new_version = diagram.metadata.version + 1
                diagram.metadata.version = new_version
                diagram.metadata.lastModified = datetime.now()

                # 새로운 ID 생성
                diagram.diagramId = str(uuid.uuid4())

                logger.info(f"새 버전 생성: diagramId={diagram.diagramId}, version={diagram.metadata.version}")

                # 변경된 다이어그램 저장
                inserted_id = await self.insert_one(diagram)
                logger.info(f"새 버전 다이어그램 저장 완료: {inserted_id}")

            elif not diagram and not latest_diagram:
                # 첫 다이어그램인 경우 기본 다이어그램 생성
                logger.info("첫 다이어그램 생성")
                new_diagram_id = str(uuid.uuid4())
                new_metadata_id = str(uuid.uuid4())

                diagram = Diagram(
                    projectId=project_id,
                    apiId=api_id,
                    diagramId=new_diagram_id,
                    components=[],
                    connections=[],
                    dto=[],
                    metadata=Metadata(
                        metadataId=new_metadata_id,
                        version=1,
                        lastModified=datetime.now(),
                        name="New Diagram",
                        description="Generated from chat"
                    )
                )

                logger.info(f"새 다이어그램 생성: diagramId={diagram.diagramId}, version={diagram.metadata.version}")
                inserted_id = await self.insert_one(diagram)
                logger.info(f"새 다이어그램 저장 완료: {inserted_id}")

            # 채팅 생성 및 저장
            chat_id = str(uuid.uuid4())
            logger.info(f"새 채팅 ID 생성: chatId={chat_id}")

            user_chat_obj = UserChat(**user_chat)

            # system_chat 처리 - 버전 정보 포함
            version_info = VersionInfo(
                newVersionId=str(diagram.metadata.version),
                description=f"Updated to version {diagram.metadata.version}"
            )

            system_chat["versionInfo"] = version_info.model_dump()
            system_chat["diagramId"] = diagram.diagramId

            system_chat_obj = SystemChat(**system_chat)

            chat = Chat(
                chatId=chat_id,
                createdAt=datetime.now(),
                userChat=user_chat_obj,
                systemChat=system_chat_obj
            )

            # 채팅 저장
            chat_dict = chat.model_dump()
            await chat_collection.insert_one(chat_dict)
            logger.info(f"채팅 저장 완료: chatId={chat_id}")

            return chat_id

        except Exception as e:
            logger.error(f"채팅 및 다이어그램 생성 중 오류 발생: {str(e)}", exc_info=True)
            raise
        
    async def _get_collection(self, collection_name):
        """
        지정된 컬렉션 이름의 MongoDB 컬렉션을 가져옵니다.
        """
        if collection_name == self.collection_name:
            return await self.get_collection()
        else:
            db = await self._get_database()
            return db[collection_name]
            
    async def _get_database(self):
        """
        MongoDB 데이터베이스 연결을 가져옵니다.
        """
        from app.infrastructure.mongodb.connection.connection import MongoDBConnection
        return await MongoDBConnection.connect()