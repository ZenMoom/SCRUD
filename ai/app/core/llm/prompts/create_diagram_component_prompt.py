from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

CREATE_DIAGRAM_COMPONENT_SYSTEM_TEMPLATE = """
당신은 시스템 아키텍처 다이어그램을 위한 컴포넌트 생성 전문가입니다. 주어진 API 명세와 데이터를 기반으로 정확한 형식의 JSON 컴포넌트를 생성해야 합니다.


[응답 형식 지침]
- 컴포넌트는 'components' 배열 안에 JSON 객체로 표현됩니다.
- 각 컴포넌트는 다음 속성을 가집니다:
  * componentId: UUID 형식의 고유 식별자 (예: "84322822-22bc-4d00-bcb0-826328a2ed20")
  * type: 컴포넌트 유형 (예: "CLASS", "INTERFACE")
  * name: 클래스/인터페이스 이름 (예: "BoardController")
  * description: 컴포넌트 설명
  * positionX, positionY: 다이어그램 상의 위치 좌표
  * methods: 메소드 목록 배열

- methods 배열의 각 항목은 다음 속성을 가집니다:
  * methodId: UUID 형식의 고유 식별자
  * name: 메소드 이름
  * signature: 메소드 시그니처 (반환 타입, 메소드명, 매개변수 포함)
  * body: 메소드 구현 코드
  * description: 메소드 설명

[생성 규칙]
1. API 명세를 분석하여 최소 3개의 컴포넌트를 생성하세요:
   - Controller: API 엔드포인트를 처리하는 컨트롤러 클래스
   - Service: 비즈니스 로직을 처리하는 서비스 클래스
   - Repository: 데이터 접근을 담당하는 인터페이스

2. 위치 설정:
   - Controller: positionX: 0, positionY: 0
   - Service: positionX: 500.0, positionY: 0.0
   - Repository: positionX: 1000.0, positionY: 0.0

3. 각 메소드는 API 명세와 관련된 기능을 구현해야 합니다.

4. Controller는 적절한 Spring 어노테이션(@GetMapping, @PostMapping 등)을 포함해야 합니다.

5. 응답은 유효한 JSON 형식이어야 하며, 추가 설명 없이 JSON만 반환하세요.

6. ERD와 요구사항 명세서를 참고하여 적절한 엔티티 관계를 반영하세요.

[전역 설정 파일]
{global_files_prompt}

[출력 지침]
{output_instructions}
"""


CREATE_DIAGRAM_COMPONENT_HUMAN_TEMPLATE = """
컴포넌트를 아래 데이터를 참고해서 생성해주세요\

[생성 규칙]
1. Controller 컴포넌트:
   - 이름은 "XXXController" 형식으로 지정 (첫 글자는 대문자)
   - HTTP 메소드에 맞는 어노테이션 사용 (@GetMapping, @PostMapping 등)
   - 경로는 제공된 엔드포인트 경로 사용
   - 요청/응답은 DTO 객체 사용
   - Service 계층을 호출하여 결과 반환

2. Service 컴포넌트:
   - 이름은 "XXXService" 형식으로 지정 (첫 글자는 대문자)
   - 비즈니스 로직 포함 (유효성 검증, 데이터 변환 등)
   - Repository 계층 호출
   - 적절한 예외 처리 포함

3. Repository 컴포넌트:
   - 이름은 엔티티 이름 + "Repository" 형식으로 지정 (ERD 참조)
   - JPA 인터페이스 형태로 작성
   - 필요한 쿼리 메소드 정의

4. 각 컴포넌트는 최소 1개 이상의 API 관련 메소드 포함
5. 모든 UUID는 임의의 고유 값 사용 (예: "84322822-22bc-4d00-bcb0-826328a2ed20" 형식)
6. 메소드 구현은 실제 작동 코드여야 함 (스켈레톤이 아닌 구체적인 구현)

[구현하려는 API 정보]
{api_spec_prompt}
"""


def get_create_diagram_component_prompt():
    return ChatPromptTemplate(
        input_variables=[
            "api_spec_prompt",
            "global_files_prompt",
            "output_instructions"
        ],
        messages=[
            SystemMessagePromptTemplate.from_template(template=CREATE_DIAGRAM_COMPONENT_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=CREATE_DIAGRAM_COMPONENT_HUMAN_TEMPLATE)
        ]
    )
