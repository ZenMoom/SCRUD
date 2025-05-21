from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.core.models.diagram_model import MethodChainPayload


class UserChatChainPayload(BaseModel):
    class MethodPromptTargetEnum(str, Enum):
        """메서드 프롬프트 대상 유형을 정의하는 열거형"""
        SIGNATURE = "SIGNATURE"  # 메서드의 선언부(매개변수, 반환 타입, 메서드명 등)만을 대상으로 함
        BODY = "BODY"  # 메서드의 구현부(실제 로직과 코드)를 대상으로 함

    class MethodPromptTagEnum(str, Enum):
        """사용자의 요청 유형을 분류하는 태그 열거형"""
        EXPLAIN = "EXPLAIN"
        REFACTORING = "REFACTORING"
        OPTIMIZE = "OPTIMIZE"
        DOCUMENT = "DOCUMENT"
        TEST = "TEST"
        SECURITY = "SECURITY"
        CONVENTION = "CONVENTION"
        ANALYZE = "ANALYZE"
        IMPLEMENT = "IMPLEMENT"

    tag: Optional[MethodPromptTagEnum] = Field(
        None,
        description="""
사용자 요청의 유형 태그로, 코드에 대한 작업 의도를 명확히 분류함 (설명, 리팩토링, 최적화 등)
EXPLAIN: 코드 동작 방식과 의도를 설명해달라는 요청
REFACTORING: 코드 구조 개선 및 재구성에 관한 요청
OPTIMIZE: 코드 실행 성능 및 자원 사용 효율성 향상에 관한 요청
CONVENTION: 코딩 표준 및 스타일 가이드 적용에 관한 요청
ANALYZE: 코드 품질, 복잡도, 의존성 등에 대한 분석 요청
IMPLEMENT: 신규 기능 또는 누락된 기능 구현에 관한 요청
"""
    )
    promptType: Optional[MethodPromptTargetEnum] = Field(
        None,
        description="""
요청이 적용될 코드 영역 유형으로, 메서드 시그니처(선언부)만 다룰지 또는 메서드 본문(구현부)까지 다룰지 지정함
SIGNATURE: 메서드의 선언부를 변경하는 요청으로 다이어그램의 대부분이 수정이 필요함
BODY: 메서드의 구현부를 대상으로 하며 targetMethods에서 요청한 메소드의 구현부에 대한 수정만 필요함
        """
    )
    message: Optional[str] = Field(
        None,
        description="""
사용자가 입력한 실제 요청 메시지 전문으로, 구체적인 작업 지시나 질문 내용이 포함됨

tag, promptType보다 더 높은 우선 순위를 가지며 promptType가 구현을 필요로하는 IMPLEMENT 라더라도 사용자가 targetMethods에 대한 설명을 요청하면
다이어그램을 변경하지않음
"""
    )
    targetMethods: List[MethodChainPayload] = Field(
        [],
        description="작업 대상이 되는 메서드 목록으로, 각 메서드의 정보(이름, 위치, 코드 등)를 담고 있는 MethodChainPayload 객체들의 리스트"
    )

    model_config = ConfigDict(from_attributes=True)

class SystemChatChainPayload(BaseModel):
    class PromptResponseEnum(str, Enum):
        """
        LLM이 코드 관련 요청을 처리한 후, 응답 결과에 따른 후속 처리 방향을 결정하는 열거형

        Values:
            MODIFIED: LLM이 코드를 수정했으므로 원본 코드를 변경해야 함
            UNCHANGED: LLM이 코드를 변경하지 않았으므로 원본 코드 유지
            EXPLANATION: LLM이 코드에 대한 설명만 제공했으므로 원본 코드 유지
            MODIFIED_WITH_NEW_COMPONENTS: LLM이 코드를 수정하고 새 컴포넌트를 추가했으므로 원본 코드와 관련 구성 요소를 변경해야 함
            ERROR: LLM 응답 처리 중 오류가 발생하여 처리 불가
        """
        MODIFIED = "MODIFIED"
        UNCHANGED = "UNCHANGED"
        EXPLANATION = "EXPLANATION"
        MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
        ERROR = "ERROR"

    status: Optional[PromptResponseEnum] = Field(None)
    message: Optional[str] = Field(None)

    model_config = ConfigDict(
        from_attributes=True,
    )

class ChatChainPayload(BaseModel):
    userChat: Optional[UserChatChainPayload] = Field(None, description="사용자 채팅 요청 정보")
    systemChat: Optional[SystemChatChainPayload] = Field(None, description="시스템 응답 정보")

    model_config = ConfigDict(
        from_attributes=True,
    )
