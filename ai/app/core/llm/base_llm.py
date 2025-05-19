import logging
from enum import Enum

from langchain_core.language_models import BaseChatModel

logger = logging.getLogger(__name__)


class ModelType(str, Enum):
    """지원하는 LLM 모델 유형"""
    OPENAI_GPT3 = "gpt-3.5-turbo"
    OPENAI_GPT4 = "gpt-4o-mini"
    OPENAI_GPT4_TURBO = "gpt-4o"


class LLMFactory:
    """LLM 모델 생성 팩토리"""

    @staticmethod
    def create_llm(
            model: ModelType,
            api_key: str,
            base_url: str,
            temperature: float,
            **kwargs
    ) -> BaseChatModel:
        """지정된 유형의 LLM 모델 생성

        Args:
            model: 모델 유형
            api_key: API 키 (선택)
            base_url:
            temperature
            **kwargs: 추가 매개변수

        Returns:
            LLM 인터페이스 구현체
        """

        if model in [ModelType.OPENAI_GPT3, ModelType.OPENAI_GPT4, ModelType.OPENAI_GPT4_TURBO]:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=model,
                api_key=api_key,
                base_url=base_url,
                temperature=temperature,
                **kwargs
            )
        else:
            raise ValueError(f"지원되지 않는 모델 유형: {model}")
