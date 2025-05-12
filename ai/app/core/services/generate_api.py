import logging

from langchain_core.output_parsers import PydanticOutputParser

from app.core.generator.api_model_generator import call_openai
from app.core.models.api_models import GenerateRequest, GenerateResponse, ApiModelList
from app.core.prompts.api_generate_prompt_template import build_prompt

logger = logging.getLogger("ai-generator")

parser = PydanticOutputParser(pydantic_object=ApiModelList)


# api 스펙 생성 함수
async def generate_api(request: GenerateRequest) -> GenerateResponse:
    """
    API 스펙 생성
    """
    # 1. 프롬프트 생성
    format_instructions = parser.get_format_instructions()
    prompt = build_prompt(request, format_instructions)

    # 2. OpenAI API 호출
    result_text = await call_openai(prompt)

    # 3. 응답 처리
    try:
        print(result_text)
        print(type(result_text))

        parsed = parser.parse(result_text).root
    except Exception as e:
        logger.error(f"파싱 실패: {e}")
        raise

    # 4. 결과 반환
    return GenerateResponse(
        success=True,
        prompt=prompt,
        result=parsed
    )
