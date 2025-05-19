from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

COMPONENT_SYSTEM_TEMPLATE = """
당신은 json형식의 메서드 컴포넌트를 생성하는 기계 입니다. 
사전에 생성된 LLM의 응답 데이터를 보고 사용자의 요청에 알맞는 메서드 컴포넌트를 생성해주세요.

응답 데이터를 기반으로 컴포넌트를 생성해야합니다. 또한 최소 2개의 Component, Method가 생성되어야합니다.

[응답 지침]
{output_instructions}
"""

COMPONENT_HUMAN_TEMPLATE = """
[응답 값]
{chat_data}
"""
def get_component_prompt():
    return ChatPromptTemplate(
        input_variables=[
            "chat_data",
            "output_instructions"
        ],
        messages=[
            SystemMessagePromptTemplate.from_template(template=COMPONENT_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=COMPONENT_HUMAN_TEMPLATE)
        ]
    )
