from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

CREATE_DIAGRAM_SYSTEM_TEMPLATE = """
응답 지침을 참고하여 컴포넌트 JSON을 생성해주세요

[응답 지침]
{output_instructions}
"""

CREATE_DIAGRAM_HUMAN_TEMPLATE = """
컴포넌트를 아래 데이터를 참고해서 생성해주세요

{complete_prompt}
"""


def get_create_diagram_prompt():
    return ChatPromptTemplate(
        input_variables=[
            "complete_prompt",
            "output_instructions"
        ],
        messages=[
            SystemMessagePromptTemplate.from_template(template=CREATE_DIAGRAM_SYSTEM_TEMPLATE),
            HumanMessagePromptTemplate.from_template(template=CREATE_DIAGRAM_HUMAN_TEMPLATE)
        ]
    )
