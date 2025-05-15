import logging
from typing import Optional

from app.api.dto.diagram_dto import DiagramResponse, PositionRequest
from app.infrastructure.http.client.api_client import GlobalFileList, ApiSpec
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository
from app.infrastructure.mongodb.repository.model.diagram_model import Diagram


class DiagramService:
    """
    다이어그램 관련 비즈니스 로직을 처리하는 서비스 클래스
    """

    def __init__(
            self,
            diagram_repository: Optional[DiagramRepository] = None,
            logger: Optional[logging.Logger] = None,
    ):
        """
        DiagramService 초기화

        Args:
            diagram_repository: DiagramRepository - 다이어그램 저장소
            logger: Logger - 로깅 객체
        """
        self.diagram_repository = diagram_repository
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info("DiagramService 초기화됨")

    async def get_diagram(self, project_id: str, api_id: str, version: int) -> DiagramResponse:
        """
        특정 프로젝트의 특정 API 버전에 대한 메서드 도식화 데이터를 가져옵니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            version: 버전

        Returns:
            DiagramResponse: 조회된 도식화 데이터

        Raises:
            ValueError: 다이어그램을 찾을 수 없을 경우
        """
        self.logger.info(f"도식화 데이터 조회: project_id={project_id}, api_id={api_id}, version_id={version}")

        # 다이어그램 조회
        diagram = await self.diagram_repository.find_by_project_api_version(project_id, api_id, version)

        if not diagram:
            self.logger.error(f"다이어그램을 찾을 수 없음: project_id={project_id}, api_id={api_id}, version_id={version}")
            raise ValueError(f"다이어그램을 찾을 수 없습니다. (project_id={project_id}, api_id={api_id}, version_id={version})")

        # 응답 데이터로 변환
        return self._convert_to_response(diagram)

    async def create_diagram(
            self,
            project_id: str,
            api_id: str,
            api_spec: ApiSpec,
            global_files: GlobalFileList,
    ) -> DiagramResponse:
        """
        특정 프로젝트의 특정 API에 대한 새로운 다이어그램을 생성합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            api_spec
            global_files
        Returns:
            DiagramResponse: 생성된 도식화 데이터

        Raises:
            ValueError: 이미 다이어그램이 존재하는 경우 (400 에러)
            Exception: 다이어그램 생성 실패 시
        """

        try:
            # 기존 다이어그램이 있는지 조회
            self.logger.info(f"다이어그램 존재 여부 확인: project_id={project_id}, api_id={api_id}")
            existing_diagrams = await self.diagram_repository.find_many({
                "projectId": project_id,
                "apiId": api_id
            })
            
            if existing_diagrams and len(existing_diagrams) > 0:
                self.logger.warn(f"이미 존재하는 다이어그램: project_id={project_id}, api_id={api_id}")
                raise ValueError(f"이미 존재하는 다이어그램입니다. (project_id={project_id}, api_id={api_id})")

            # 기존 다이어그램이 없으면 새로 생성
            self.logger.info(f"새 다이어그램 생성: project_id={project_id}, api_id={api_id}")

            diagram: Diagram = await self.create_llm_diagram(
                project_id=project_id,
                api_id=api_id,
                global_files=global_files,
                api_spec=api_spec
            )
            # 저장
            new_diagram = await self.diagram_repository.save(diagram)
            # 응답 데이터로 변환
            return self._convert_to_response(new_diagram)

        except ValueError as e:
            # 400-level 에러 처리
            self.logger.warn(f"다이어그램 생성 실패 (기존 다이어그램 존재): {str(e)}")
            raise

        except Exception as e:
            self.logger.error(f"다이어그램 생성 실패: {str(e)}")
            raise Exception(f"다이어그램 생성에 실패했습니다: {str(e)}")

    async def update_component_position(
            self, project_id: str, api_id: str, component_id: str, position_data: PositionRequest
    ) -> DiagramResponse:
        """
        도식화에서 특정 컴포넌트의 위치 좌표를 변경합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            component_id: 컴포넌트 ID
            position_data: 새 위치 데이터 (x, y 좌표)

        Returns:
            DiagramResponse: 업데이트된 다이어그램 정보

        Raises:
            ValueError: 컴포넌트를 찾을 수 없을 경우
        """
        self.logger.info(
            f"컴포넌트 위치 업데이트: project_id={project_id}, api_id={api_id}, "
            f"component_id={component_id}, x={position_data.x}, y={position_data.y}"
        )

        # 컴포넌트 위치 업데이트
        updated_diagram = await self.diagram_repository.update_component_position(
            project_id, api_id, component_id, position_data.x, position_data.y
        )

        if not updated_diagram:
            self.logger.error(
                f"컴포넌트를 찾을 수 없음: project_id={project_id}, api_id={api_id}, component_id={component_id}"
            )
            raise ValueError(f"컴포넌트를 찾을 수 없습니다. (component_id={component_id})")

        # 응답 데이터로 변환
        return self._convert_to_response(updated_diagram)

    def _convert_to_response(self, diagram: Diagram) -> DiagramResponse:
        """
        내부 Diagram 모델을 DiagramResponse DTO로 변환합니다.

        Args:
            diagram: Diagram 모델 객체

        Returns:
            DiagramResponse: 응답 형식으로 변환된 다이어그램 데이터
        """
        # 모델을 딕셔너리로 변환
        diagram_dict = diagram.model_dump()


        # DiagramResponse 형식에 맞게 데이터 구성
        response_data = {
            "diagramId": diagram_dict["diagramId"],
            "metadata": diagram_dict["metadata"],
            "components": diagram_dict["components"],
            "connections": diagram_dict["connections"],
            "dto": diagram_dict["dto"],
            "apiId": diagram_dict["apiId"],
            "projectId": diagram_dict["projectId"],
        }

        return DiagramResponse(**response_data)

    async def create_llm_diagram(
            self,
            project_id: str,
            api_id: str,
            global_files: GlobalFileList,
            api_spec: ApiSpec,
    ) -> Diagram:
        """
        LangChain Agent를 사용하여 OpenAPI 명세로부터 다이어그램을 생성합니다.

        Args:
            project_id: 프로젝트 ID
            api_id: API ID
            api_spec: OpenAPI 명세 데이터
            global_files
        Returns:
            Diagram: 생성된 다이어그램 객체
        """
        self.logger.info(f"LLM 다이어그램 생성 시작 (Agent 사용): project_id={project_id}, api_id={api_id}")

        # 1. LLM 설정
        from app.config.config import settings
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_BASE,
            temperature=0.0,
        )

        # 2. 파서 설정
        from langchain_core.output_parsers import PydanticOutputParser
        from app.infrastructure.mongodb.repository.model.diagram_model import Diagram
        parser = PydanticOutputParser(pydantic_object=Diagram)

        # 3. 도구 정의
        from langchain_core.tools import tool

        @tool
        def generate_uuid() -> str:
            """UUID를 생성합니다. 다이어그램 내 각 요소(컴포넌트, 메서드, 연결 등)의 ID를 생성할 때 사용하세요."""
            import uuid
            return str(uuid.uuid4())

        @tool
        def get_current_datetime() -> str:
            """현재 날짜와 시간을 ISO 형식의 문자열로 반환합니다. 다이어그램의 lastModified 필드를 설정할 때 사용하세요."""
            from datetime import datetime
            return datetime.now().isoformat()

        # 4. Agent 프롬프트 생성
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
        from langchain_core.messages import SystemMessage

        system_message = """당신은 OpenAPI 명세를 분석하여 Spring Boot 아키텍처 기반의 UML 클래스 다이어그램을 생성하는 전문가입니다.

주어진 OpenAPI 명세를 분석해서 다음과 같은 구성요소를 포함하는 다이어그램을 생성해야 합니다:
1. Controller, Service, Repository 등의 컴포넌트 (클래스 또는 인터페이스)
2. 각 컴포넌트의 메서드 (명세의 엔드포인트에 해당하는 메서드)
3. 메서드 간의 연결 관계 (Controller -> Service -> Repository 흐름)
4. DTO 모델 (요청/응답 객체)

다이어그램 생성 과정:
1. 각 엔드포인트에 해당하는 Controller 메서드 생성
2. Controller 메서드에 맞는 Service와 Repository 메서드 생성
3. 컴포넌트 간 연결 관계 설정
4. 요청/응답 객체를 기반으로 DTO 모델 생성
5. UUID 생성 도구를 사용하여 각 요소의 고유 ID 생성

최종 결과는 다음 필드를 포함하는 Diagram 객체여야 합니다:
- diagramId: 다이어그램 ID (UUID)
- projectId: 프로젝트 ID (입력 파라미터로 제공됨)
- apiId: API ID (입력 파라미터로 제공됨)
- components: 컴포넌트 목록 (클래스/인터페이스, componentId는 UUID)
- connections: 메서드 간 연결 관계 (connectionId: UUID)
- dto: DTO 모델 목록 (dtoId: UUID)
- metadata: 다이어그램 메타데이터 (버전, 수정일시 등)

모든 ID 필드는 generate_uuid 도구로 생성해야 합니다. 특히 methodId끼리 겹치거나 componentId가 겹치는 일이 없도록 주의하세요  
최종 출력은 Pydantic 스키마에 맞게 형식화되어야 합니다.

"""

        prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessage(content=system_message),
                SystemMessage(content=parser.get_format_instructions()),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )

        # 5. Agent 및 Executor 생성
        from langchain.agents import create_tool_calling_agent, AgentExecutor

        # 도구 목록 정의
        tools = [generate_uuid, get_current_datetime]

        # Agent 생성
        agent = create_tool_calling_agent(llm, tools, prompt)

        # AgentExecutor 생성
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
        )

        # 6. Agent 실행
        input_msg = f"""
        다음 OpenAPI 명세를 분석하여 Spring Boot 아키텍처 패턴을 따르는 다이어그램을 생성해주세요.
        다음의 내용들을 모두 고려 해주세요
        [고려할 사항]
        {global_files.model_dump_json()}
        
        [OpenAPI 명세]
        {api_spec.model_dump_json()}

        프로젝트 ID: {project_id}
        API ID: {api_id}

        메서드와 연결 관계를 포함하세요.
        """

        self.logger.info("Agent 실행 중...")
        result = await agent_executor.ainvoke({"input": input_msg})

        # 7. 결과 처리
        try:
            diagram = parser.parse(result["output"])

            # 프로젝트 ID와 API ID 확인 및 설정
            diagram.projectId = project_id
            diagram.apiId = api_id

            self.logger.info(f"에이전트가 생성한 다이어그램: ID={diagram.diagramId}")
            return diagram

        except Exception as e:
            self.logger.error(f"다이어그램 생성 중 오류 발생: {str(e)}")
