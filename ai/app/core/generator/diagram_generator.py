import json
import uuid
from datetime import datetime

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config.config import settings
from app.infrastructure.mongodb.repository.model.diagram_model import MethodPromptTagEnum, \
    MethodPromptTargetEnum, Metadata, Diagram


class DateTimeEncoder(json.JSONEncoder):
    """datetime 객체를 ISO 형식 문자열로 변환하는 사용자 정의 JSON 인코더"""

    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class DiagramProcessor:
    def __init__(self, logger, parser):
        """
        DiagramProcessor 초기화

        Args:
            logger: 로깅을 위한 로거 객체
            parser: LLM 응답을 파싱하기 위한 파서 객체
        """
        self.logger = logger
        self.parser = parser

    def _build_prompt(self, user_chat_data, latest_diagram):
        """
        사용자 입력 및 다이어그램 데이터를 기반으로 LLM 프롬프트를 생성합니다.

        Args:
            user_chat_data: 사용자 채팅 데이터 객체
            latest_diagram: 최신 다이어그램 데이터 객체

        Returns:
            str: 생성된 전체 프롬프트 문자열
        """
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
        from app.core.prompts.few_shot_prompt_template import DiagramPromptGenerator
        template = DiagramPromptGenerator()  # 실제 DiagramPromptGenerator 사용
        base_prompt = template.get_prompt()

        # 최종 프롬프트 생성
        openapi_spec_dict = latest_diagram.dict() if latest_diagram else {}  # latest_diagram이 None일 경우 빈 dict 사용
        self.logger.info(f"openapi_spec: {openapi_spec_dict}")

        complete_prompt = f"""
        {base_prompt.format(openapi_spec=json.dumps(openapi_spec_dict, indent=2, cls=DateTimeEncoder))}

        요청 사항:
        {prompt_type_instruction}
        {tag_instruction}

        사용자 메시지:
        {user_chat_data.message}
        """
        self.logger.info(f"생성된 프롬프트 일부: {complete_prompt}...")
        return complete_prompt

    async def _call_llm(self, complete_prompt, diagram_code, latest_diagram: Diagram):
        """
        생성된 프롬프트를 사용하여 LLM을 호출합니다.

        Args:
            complete_prompt (str): LLM에 전달할 전체 프롬프트

        Returns:
            str: LLM의 응답 내용
        """
        self.logger.info("LLM 호출 시작")
        self.logger.info(f"{diagram_code.content}")
        llm = ChatOpenAI(
            temperature=0,
            model="gpt-4o-mini",  # 필요시 모델 변경
            base_url=settings.OPENAI_API_BASE,
            api_key=settings.OPENAI_API_KEY
        )
        system_message = f"""
        당신은 사용자가 입력한 코드를 다이어그램으로 변환해주는 다이어그램 변환기 입니다. 
        
        다음 입력을 참고해서 사용자의 입력을 다이어그램으로 변환해야합니다.

        
        [입력]
        {complete_prompt}
        
        [현재 다이어그램 상태]
        {latest_diagram.model_dump_json()}
        
        [출력 형식]
        {self.parser.get_format_instructions()}
        """
        self.logger.info(f"파서 내용: {self.parser.get_format_instructions()}")
        human_message = diagram_code.content
        chat_prompt = ChatPromptTemplate([
            SystemMessage(content=system_message),
            HumanMessage(content=human_message)
        ])
        chain = chat_prompt | llm
        response = await chain.ainvoke({})

        self.logger.info("LLM 호출 완료")
        return response.content

    def _parse_llm_response(self, response_content):
        """
        LLM의 응답 내용을 파싱합니다.

        Args:
            response_content (str): LLM의 응답 문자열

        Returns:
            Any: 파싱된 다이어그램 데이터

        Raises:
            Exception: 파싱 실패 시 발생
        """
        self.logger.info("응답 파싱 시작")

        try:
            diagram_data = self.parser.parse(response_content)
            self.logger.info("응답 파싱 성공")
            return diagram_data
        except Exception as parse_error:
            self.logger.error(f"응답 파싱 실패: {str(parse_error)}", exc_info=True)
            self.logger.info(f"실패한 파싱 내용 (일부):\n{response_content[:1000]}...")
            raise

    async def _update_and_save_diagram(self, diagram_data, project_id, api_id, user_chat_data_tag, latest_diagram):
        """
        파싱된 다이어그램 데이터를 업데이트하고 MongoDB에 저장합니다.

        Args:
            diagram_data: 파싱된 다이어그램 데이터
            project_id (str): 프로젝트 ID
            api_id (str): API ID
            user_chat_data_tag (str): 사용자 채팅 데이터의 태그
            latest_diagram: 최신 다이어그램 데이터 객체

        Returns:
            Any: 저장된 다이어그램 데이터 (또는 ID)
        """
        self.logger.info("다이어그램 메타데이터 업데이트 및 저장 시작")
        if not (project_id and api_id):
            self.logger.warning("project_id 또는 api_id가 제공되지 않아 저장하지 않습니다.")
            return diagram_data  # 저장하지 않고 반환

        # UUID 생성 및 기본 정보 설정
        diagram_data.projectId = project_id
        diagram_data.apiId = api_id
        diagram_data.diagramId = str(uuid.uuid4())

        # 버전 관리
        version = 1
        if latest_diagram and hasattr(latest_diagram, 'metadata') and latest_diagram.metadata:
            version = latest_diagram.metadata.version + 1
        else:
            self.logger.info(f"최신 다이어그램이 없거나 메타데이터가 없어 새 버전 1로 시작합니다.")

        # 메타데이터 설정 또는 업데이트
        current_time = datetime.now()
        if not hasattr(diagram_data, 'metadata') or not diagram_data.metadata:
            diagram_data.metadata = Metadata(  # 실제 Metadata 클래스 사용
                metadataId=str(uuid.uuid4()),
                version=version,
                lastModified=current_time,
                name=f"API Diagram for {api_id} (v{version})",
                description=f"Generated from OpenAPI spec using tag: {user_chat_data_tag}"
            )
        else:
            diagram_data.metadata.version = version
            diagram_data.metadata.lastModified = current_time
            # diagram_data.metadata.name과 description도 필요시 업데이트 가능


        return diagram_data  # 저장 후의 diagram_data 반환 (혹은 inserted_id 등 필요에 따라)

    async def generate_diagram_data(
            self,
            user_chat_data,
            latest_diagram,
            project_id=None,
            api_id=None,
            diagram_code=str
    ):
        """
        도식화 데이터를 생성하는 전체 프로세스를 실행합니다.

        Args:
            user_chat_data: 사용자 채팅 데이터 (promptType, tag, message, targetMethods 포함)
            latest_diagram: 최신 다이어그램 데이터 (dict() 메서드 및 metadata 속성 가정)
            project_id (str, optional): 프로젝트 ID. Defaults to None.
            api_id (str, optional): API ID. Defaults to None.
            diagram_code

        Returns:
            Any: 생성되고 저장된 다이어그램 데이터

        Raises:
            Exception: 프로세스 중 오류 발생 시
        """
        try:
            # 1. 프롬프트 생성
            complete_prompt: str = self._build_prompt(user_chat_data, latest_diagram)

            # 2. LLM 호출
            response_content = await self._call_llm(
                complete_prompt,
                diagram_code,
                latest_diagram
            )

            # 3. 응답 파싱
            diagram_data = self._parse_llm_response(response_content)

            # 4. 다이어그램 업데이트 및 저장
            # user_chat_data.tag를 명시적으로 전달
            updated_diagram_data = await self._update_and_save_diagram(
                diagram_data,
                project_id,
                api_id,
                user_chat_data.tag,  # tag 정보 전달
                latest_diagram
            )

            return updated_diagram_data

        except Exception as e:
            self.logger.error(f"Diagram_Generator 도식화 데이터 생성 중 오류 발생: {str(e)}", exc_info=True)
            raise