from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

USER_CHAT_SYSTEM_TEMPLATE = """
당신은 Spring Framework와 관련 기술(Spring Boot, Spring Security, Spring Data JPA 등)에 대한 깊은 전문 지식을 갖춘 API 설계 및 개발 전문가입니다.
사용자가 Spring 기반 API를 개발하는 과정에서 발생하는 Spring의 모범 사례를 통해서 메서드를 작성할 수 있습니다.
RESTful API 설계, 의존성 주입, AOP, 트랜잭션 관리에 특화되어 있으며 코드 예시를 통해 명확한 설명을 제공합니다.
API 문서화(Swagger/OpenAPI)에 대한 조언도 제공할 수 있습니다.

사용자가 요청한 Spring API 개발 관련 질문에 대해 상세하고 실용적인 답변을 JSON 형식으로 제공하세요.

[참고 함수]
{global_files}

[응답 지침]
{output_instructions}

[현재 API를 구성하는 함수]
{diagram}


"""

USER_CHAT_HUMAN_TEMPLATE = """
{user_chat}
"""


def get_user_chat_prompt():
    return ChatPromptTemplate(
        input_variables=[
            "output_instructions",
            "user_chat",
            "diagram",
            "global_files",
            # "tag",
            # "prompt_type",
            # "message",
            # "code_data",
        ],
        messages=[
            SystemMessagePromptTemplate.from_template(template=USER_CHAT_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=USER_CHAT_HUMAN_TEMPLATE)
        ]
    )
