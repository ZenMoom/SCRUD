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
        """시스템 응답 상태를 나타내는 열거형"""
        MODIFIED = "MODIFIED"
        UNCHANGED = "UNCHANGED"
        EXPLANATION = "EXPLANATION"
        MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
        ERROR = "ERROR"

    status: Optional[PromptResponseEnum] = Field(
        None,
        description="""
사용자가 요청한 message, tag, promptType을 종합적으로 고려하여 다음과 같은 ENUM으로 표현

message를 보고 현재 Diagram이 변경이 필요하다고 판단되는경우 -> MODIFIED, MODIFIED_WITH_NEW_COMPONENTS
message를 보고 현재 Diagram이 변경이 필요하지 않은 경우 -> UNCHANGED, EXPLANATION

[추가 설명]
MODIFIED: 요청을 처리하기 위해서 다이어그램의 변경이 필요함
UNCHANGED: 사용자의 요청에 따른 다이어그램의 변경이 필요하지않음
EXPLANATION: 다이어그램을 통한 설명이나 분석 결과만 제공함
MODIFIED_WITH_NEW_COMPONENTS: 기존 코드 수정과 함께 새로운 컴포넌트(클래스, 메서드 등)가 추가 필요할 것으로 판단됨
ERROR: 위에서 처리하지 못한 예외의 상황이 발생함
"""
    )
    message: Optional[str] = Field(
        None,
        description="""
## 스프링 기반 클래스 다이어그램 생성 요청

### 요청 사항
사용자가 제공한 정보(채팅 내용, 프롬프트 유형, 태그)를 철저히 분석하여 스프링 프레임워크 환경에 최적화된 클래스 다이어그램을 직접 텍스트로 작성해주세요. JSON 형식의 중간 처리 결과나 상태 메시지를 포함하지 마세요.

### 필수 포함 요소
1. **도메인 모델 및 엔티티 구조**
   - 주요 엔티티 클래스와 관계(@OneToMany, @ManyToOne 등)
   - 각 클래스의 필드와 메서드
   - 상속 및 구현 관계

2. **계층별 구조 설계**
   - Controller 레이어
   - Service 레이어
   - Repository 레이어
   - DTO/VO 객체

3. **스프링 특화 컴포넌트**
   - @Component, @Service, @Repository, @Controller 등 주요 어노테이션
   - 의존성 주입 방식(@Autowired, 생성자 주입 등)
   - AOP 요소(해당될 경우)

### 출력 형식
1. 클래스 간 관계와 상호작용에 대한 설명
2. 구현 시 참고해야 할 스프링 프레임워크 모범 사례

### 기술 스택 명시
프로젝트에 적용될 정확한 스프링 버전과 관련 기술(Spring Boot, Spring Data JPA, Spring Security 등)을 명시하여 버전 호환성 문제를 방지하세요.

### 확장성 고려
미래 요구사항 변경에 대응할 수 있는 유연한 설계를 제안하고, 이러한 설계 결정에 대한 근거를 설명하세요.

### 중요 지침
줄 바꿈을 할 때 + 를 통한 줄 바꿈은 지양합니다(JSON 형식을 맞춰야합니다.)
"""
    )

    model_config = ConfigDict(
        from_attributes=True,
    )

class ChatChainPayload(BaseModel):
    userChat: Optional[UserChatChainPayload] = Field(None, description="사용자 채팅 요청 정보")
    systemChat: Optional[SystemChatChainPayload] = Field(None, description="시스템 응답 정보")

    model_config = ConfigDict(
        from_attributes=True,
    )
