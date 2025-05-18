from langchain.prompts import PromptTemplate

DTO_MODEL_TEMPLATE = """
DTO를 생성하세요

[API 정보]
{api_spec}

[응답 지침]
{output_instructions}
"""

DTO_MODEL_HUMAN_TEMPLATE = """
DTO 모델을 생성해주세요
"""


def get_dto_prompt():
    return PromptTemplate(
        input_variables=[
            "api_spec",
            "output_instructions"
        ],
        template=DTO_MODEL_TEMPLATE
    )
