import asyncio

from langchain.chat_models.base import BaseChatModel
from langchain_anthropic import ChatAnthropic
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI

from app.config.config import settings
from app.core.generator.streaming_handler import SSEStreamingHandler


class ModelGenerator:

    def get_chat_model(self, model_type: str, response_queue: asyncio.Queue, **kwargs) -> BaseChatModel:
        streaming_handler = SSEStreamingHandler(response_queue)
        """모델 타입에 따라 적절한 채팅 모델을 반환합니다."""
        if model_type.lower() == "anthropic":
            return ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                streaming=True,
                callbacks=[streaming_handler],
                timeout=None,
                temperature=0.5,
                max_retries=2,
                api_key=settings.ANTHROPIC_API_KEY,
                **kwargs
            )
        elif model_type.lower() == "ollama":
            return ChatOllama(
                # model="gemma3:4b-it-qat", # 로컬 30초
                model="gemma3:4b", # 로컬 23초
                streaming=True,
                callbacks=[streaming_handler],
                temperature=0.5,
                base_url=settings.OLLAMA_API_URL,
                **kwargs
            )
        elif model_type.lower() == "openai":
            return ChatOpenAI(
                model="gpt-4o-mini",
                streaming=True,
                callbacks=[streaming_handler],
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                **kwargs
            )
        else:
            raise ValueError(f"지원하지 않는 모델 타입: {model_type}")