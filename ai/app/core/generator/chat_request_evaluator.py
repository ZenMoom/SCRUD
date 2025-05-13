from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langchain_core.messages import HumanMessage


class PropositionAnalysis(BaseModel):
    reasoning: str = Field(description="수정이 필요하다고 생각되는 이유에 대해서 설명")
    is_true: bool = Field(description="주어진 코드가 수정이 필요하다고 생각된다면 True, 수정이 필요없다면 False")


class ChatRequestEvaulator:
    """
    주어진 코드가 수정이 필요한지 판단하는 클래스
    """

    def __init__(self, model_name: str = "gpt-4o-mini"):
        """
        PropositionValidator 초기화

        Args:
            model_name: 사용할 언어 모델 이름
        """
        self._parser = PydanticOutputParser(pydantic_object=PropositionAnalysis)
        from app.config.config import settings
        self._llm = ChatOpenAI(
            temperature=0,
            model=model_name,
            base_url=settings.OPENAI_API_BASE,
            api_key=settings.OPENAI_API_KEY
        )

        # 프롬프트 템플릿 설정
        template = """
                당신은 API 명세와 도식화를 생성하고 관리하는 AI 서비스의 일부입니다.
                사용자의 요청을 분석하여 도식화 생성이 필요한지 결정한 다음, 적절한 응답을 제공해야 합니다.
                응답 요청은 한국어로 작성합니다.

                # 결정 가이드라인
                1. 코드 구현, 업데이트, 수정이 필요한 요청
                2. 새로운 컴포넌트나 메서드 추가 요청
                3. 성능 최적화나 코드 리팩토링 요청
                4. 구조 변경이 필요한 요청
                5. 사용자가 명시적으로 도식화 생성/수정을 요청하는 경우

                도식화 생성이 필요 없는 경우
                1. 단순 정보 요청이나 설명 요청
                2. 설명이나 분석만 필요한 경우
                3. 코드 구현이나 변경 없이 질문에 답변만 필요한 경우

                # 메시지 분석
                1. tag 값을 확인하세요:
                   - IMPLEMENT, REFACTORING, OPTIMIZE는 일반적으로 도식화 생성이 필요합니다.
                   - EXPLAIN, ANALYZE, DOCUMENT는 일반적으로 도식화 생성이 필요 없습니다.
                   - 하지만 이것은 절대적인 규칙이 아닙니다. 메시지 내용을 우선적으로 고려하세요.

                2. 메시지 내용을 더 중요하게 고려하세요:
                   - "만들어줘", "구현해줘", "변경해줘", "추가해줘"와 같은 요청은 도식화 생성이 필요할 가능성이 높습니다.
                   - "설명해줘", "이해하기 어려워", "왜 이렇게 되어 있어?"와 같은 질문은 도식화 생성이 필요 없을 가능성이 높습니다.
                   
                3. message를 보고 targetMethods 들의 관계를 살핀뒤 메서드의 수정이 필요한 지 판단해주세요
        """

        # 프롬프트 템플릿 설정
        self._chat_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=template),
            SystemMessage(content=self._parser.get_format_instructions()),
            HumanMessagePromptTemplate.from_template("{proposition}"),

        ])

        print(f"self._chat_prompt: {self._chat_prompt.get_prompts()}")
        # 체인 구성
        self._chain = self._chat_prompt | self._llm | self._parser

    def validate(self, proposition: str) -> PropositionAnalysis:
        """
        명제의 참/거짓을 판단

        Args:
            proposition: 수정이 필요하다고 생각되는 문자열

        Returns:
            PropositionAnalysis: 분석 결과 객체
        """
        result = self._chain.invoke({"proposition": proposition})
        return result