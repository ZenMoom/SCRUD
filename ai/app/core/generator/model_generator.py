from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.chat_models.base import BaseChatModel
from langchain_anthropic import ChatAnthropic
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from app.core.generator.stream_handler import streaming_handler
from app.config.config import settings

class ModelGenerator:

    def get_chat_model(self, model_type: str, **kwargs) -> BaseChatModel:
        """모델 타입에 따라 적절한 채팅 모델을 반환합니다."""
        if model_type.lower() == "anthropic":
            return ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                temperature=0.5,
                timeout=None,
                max_retries=2,
                callbacks=[streaming_handler],
                api_key=settings.ANTHROPIC_API_KEY,
                **kwargs
            )
        elif model_type.lower() == "ollama":
            return ChatOllama(
                streaming=True,
                callbacks=[streaming_handler],
                model="exaone3.5:latest",
                temperature=0.5,
                **kwargs
            )
        elif model_type.lower() == "openai":
            return ChatOpenAI(
                model="gpt-4o-mini",
                callbacks=[streaming_handler],
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
            )
        else:
            raise ValueError(f"지원하지 않는 모델 타입: {model_type}")