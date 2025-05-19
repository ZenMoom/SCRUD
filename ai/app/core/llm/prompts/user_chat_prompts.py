from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

USER_CHAT_SYSTEM_TEMPLATE = """
사용자의 요청으로 부터 답변을 생성하세요. 응답 지침을 참고해서 JSON형식으로 답변을 나타내 주세요.


[응답 지침]
{output_instructions}

[현재 API를 구성하는 함수]
{diagram}


"""

USER_CHAT_HUMAN_TEMPLATE = """
[채팅 데이터]
- 태그: {tag}
- 프롬프트 타입: {prompt_type}
- 메시지: {message}
- 대상 메소드: {code_data}
"""


def get_user_chat_prompt():
    return ChatPromptTemplate(
        input_variables=[
            "output_instructions",
            # "global_files",
            "diagram",

            "tag",
            "prompt_type",
            "message",
            "code_data",
        ],
        messages=[
            SystemMessagePromptTemplate.from_template(template=USER_CHAT_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=USER_CHAT_HUMAN_TEMPLATE)
        ]
    )
