from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

CREATE_DIAGRAM_COMPONENT_SYSTEM_TEMPLATE = """
당신은 시스템 아키텍처 다이어그램을 위한 컴포넌트 생성 전문가입니다. 주어진 API 명세와 데이터를 기반으로 정확한 형식의 JSON 컴포넌트를 생성해야 합니다.
답변받는 사람은 한국인입니다. 한국어로 답변해주세요.

[응답 형식 지침]
- 컴포넌트는 'components' 배열 안에 JSON 객체로 표현됩니다.
- components: 클래스, 인터페이스에 대한 필드입니다. 내부의 methods 필드를 통해 메서드에 대한 구현이 들어갑니다.

- 각 컴포넌트는 다음 속성을 가집니다:
  * componentId: UUID 형식의 고유 식별자 (예: "84322822-22bc-4d00-bcb0-826328a2ed20")
  * type: 컴포넌트 유형 (예: "CLASS", "INTERFACE")
  * name: 클래스/인터페이스 이름 (예: "BoardController")
  * description: 컴포넌트 설명
  * positionX, positionY: 다이어그램 상의 위치 좌표
  * methods: 메소드 목록 배열

- methods 배열의 각 항목은 다음 속성을 가집니다:
  * methodId: UUID 형식의 고유 식별자 (예: "84322822-22bc-4d00-bcb0-826328a2ed20")
  * name: 메소드 이름
  * signature: 메소드 시그니처 (반환 타입, 메소드명, 매개변수 포함)
  * body: 어노테이션, 시그니처, 메서드 바디가 모두 포함된 코드 (시각적으로 보기 좋도록 탭 또는 띄워쓰기를 적절히 사용합니다. class, interface의 내용이 포함되어선 안됩니다.)
  * description: 메소드가 어떤 기능을 하는지에 대한 설명

[생성 규칙]
1. [전역 설정 파일]의 아키텍처 구조를 통해 컴포넌트를 설계합니다. 단, 아래 3개의 컴포넌트가 포함되어야 합니다.:
   - Controller: API 엔드포인트를 처리하는 컨트롤러 클래스
   - Service: 비즈니스 로직을 처리하는 서비스 클래스
   - Repository: 데이터 접근을 담당하는 인터페이스

2. API 명세를 파악한 뒤 명세에 맞는 Controller 클래스 컴포넌트의 시그니처를 구성해야합니다.

3. 컴포넌트 위치 규칙
    - Controller 컴포넌트는 positionX, positionY (0, 0)으로 시작합니다
    - Controller 부터 Repository 까지 논리적 흐름에 맞도록 컴포넌트들을 배치합니다. 일반적으로 Controller - (Converter) - Service - Repository 의 논리 흐름을 따릅니다. 
    - 서로 다른 컴포넌트 유형 간의 positionX 간격은 500입니다
    - 같은 유형의 컴포넌트(예: (AService, BService) 또는 (AConverter, BConverter)는 positionY 값을 300씩 증가시켜 구분합니다
      (예: Controller가 (0, 0), ServiceA = (500, 0), ServiceB = (500, 300))

4. 각 메소드는 API 명세와 관련된 기능을 구현해야 합니다.

5. Controller는 적절한 Spring 어노테이션(@GetMapping, @PostMapping 등)을 포함해야 합니다.

6. 응답은 유효한 JSON 형식이어야 하며, 추가 설명 없이 JSON만 반환하세요.

7. ERD와 요구사항 명세서를 참고하여 적절한 엔티티 관계를 반영하세요.

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
