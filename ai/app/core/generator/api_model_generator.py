from openai import AsyncOpenAI

from app.config.config import settings

# OpenAI 설정
openai_client = AsyncOpenAI(
    base_url=settings.OPENAI_API_BASE,
    api_key=settings.OPENAI_API_KEY
)


# OpenAI API 호출
async def call_openai(prompt: str) -> str:
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "너는 API 스펙을 생성하는 도우미야."},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        stream=False
    )
    return response.choices[0].message.content
