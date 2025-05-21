from langchain_core.messages import SystemMessage, HumanMessage

from app.config.config import settings
from app.core.llm.base_llm import LLMFactory, ModelType

# LLMFactory를 통한 OpenAI 클라이언트 생성
openai_client = LLMFactory.create_llm(
    model=ModelType.OPENAI_GPT4_1,
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_API_BASE,
    temperature=0,
)


# OpenAI API 호출
async def call_openai(prompt: str) -> str:
    system_message = SystemMessage(content="너는 API 스펙을 생성하는 도우미야.")
    human_message = HumanMessage(content=prompt)
    
    messages = [system_message, human_message]
    response = await openai_client.ainvoke(messages)
    
    return response.content
