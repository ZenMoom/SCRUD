from enum import Enum
from typing import Dict, Type


class FileTypeEnumDto(str, Enum):
    REQUIREMENTS = "REQUIREMENTS"
    ERD = "ERD"
    UTIL = "UTIL"
    CONVENTION = "CONVENTION"
    CONVENTION_DEFAULT = "CONVENTION_DEFAULT"
    DEPENDENCY = "DEPENDENCY"
    ERROR_CODE = "ERROR_CODE"
    SECURITY = "SECURITY"
    SECURITY_DEFAULT_JWT = "SECURITY_DEFAULT_JWT"
    SECURITY_DEFAULT_SESSION = "SECURITY_DEFAULT_SESSION"
    SECURITY_DEFAULT_NONE = "SECURITY_DEFAULT_NONE"
    ARCHITECTURE_GITHUB = "ARCHITECTURE_GITHUB"
    ARCHITECTURE_DEFAULT_LAYERED_A = "ARCHITECTURE_DEFAULT_LAYERED_A"
    ARCHITECTURE_DEFAULT_LAYERED_B = "ARCHITECTURE_DEFAULT_LAYERED_B"
    ARCHITECTURE_DEFAULT_CLEAN = "ARCHITECTURE_DEFAULT_CLEAN"
    ARCHITECTURE_DEFAULT_MSA = "ARCHITECTURE_DEFAULT_MSA"
    ARCHITECTURE_DEFAULT_HEX = "ARCHITECTURE_DEFAULT_HEX"

class EnumPromptBuilder:
    """
    Enum 값에 대한 설명 프롬프트를 생성하는 유틸리티 클래스입니다.
    이를 통해 LLM이 응답을 생성할 때 각 Enum 값의 의미를 이해할 수 있습니다.
    """

    @staticmethod
    def build_file_type_enum_prompt() -> str:
        """
        FileTypeEnumDto 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 파일 유형 enum을 설명하는 형식화된 프롬프트
        """
        descriptions = {
            FileTypeEnumDto.REQUIREMENTS: "프로젝트 요구사항 명세 문서",
            FileTypeEnumDto.ERD: "데이터베이스 설계를 위한 Entity-Relationship 다이어그램",
            FileTypeEnumDto.UTIL: "유틸리티 클래스 정의 및 헬퍼 함수",
            FileTypeEnumDto.CONVENTION: "사용자 지정 코드 컨벤션 및 스타일 가이드",
            FileTypeEnumDto.CONVENTION_DEFAULT: "기본 코드 컨벤션 및 스타일 가이드라인",
            FileTypeEnumDto.DEPENDENCY: "프로젝트 의존성 및 라이브러리 구성",
            FileTypeEnumDto.ERROR_CODE: "에러 코드 정의 및 처리 전략",  # file content 가 있다.
            FileTypeEnumDto.SECURITY: "사용자 지정 보안 구성 및 정책",
            FileTypeEnumDto.SECURITY_DEFAULT_JWT: "기본 JWT 기반 보안 구성", # file content가 타입 그자체
            FileTypeEnumDto.SECURITY_DEFAULT_SESSION: "기본 세션 기반 보안 구성", # file content가 타입 그자체
            FileTypeEnumDto.SECURITY_DEFAULT_NONE: "보안 구성 없음 (개발/테스트 전용)", # file content가 타입 그자체
            FileTypeEnumDto.ARCHITECTURE_GITHUB: "GitHub 저장소에서 가져온 아키텍처 정의", # file content가 타입 그자체
            FileTypeEnumDto.ARCHITECTURE_DEFAULT_LAYERED_A: "기본 계층형 아키텍처 스타일 A (프레젠테이션, 애플리케이션, 도메인, 인프라)",
            FileTypeEnumDto.ARCHITECTURE_DEFAULT_LAYERED_B: "기본 계층형 아키텍처 스타일 B (컨트롤러, 서비스, 레포지토리)",
            FileTypeEnumDto.ARCHITECTURE_DEFAULT_CLEAN: "기본 클린 아키텍처 (엔티티, 유스케이스, 어댑터, 프레임워크)",
            FileTypeEnumDto.ARCHITECTURE_DEFAULT_MSA: "마이크로서비스 아키텍처 패턴",
            FileTypeEnumDto.ARCHITECTURE_DEFAULT_HEX: "헥사고날/포트 및 어댑터 아키텍처"
        }
        
        return EnumPromptBuilder._format_enum_prompt("파일 유형", FileTypeEnumDto, descriptions)

    @staticmethod
    def build_method_prompt_tag_enum_prompt() -> str:
        """
        MethodPromptTagEnum 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 메서드 프롬프트 태그를 설명하는 형식화된 프롬프트
        """
        descriptions = {
            MethodPromptTagEnum.EXPLAIN: "메서드의 목적과 기능에 대한 설명 요청",
            MethodPromptTagEnum.REFACTORING: "메서드를 개선하기 위한 리팩토링 제안 요청",
            MethodPromptTagEnum.OPTIMIZE: "메서드 성능을 향상시키기 위한 최적화 제안 요청",
            MethodPromptTagEnum.DOCUMENT: "메서드 문서화 요청",
            MethodPromptTagEnum.CONVENTION: "코드 컨벤션 준수 요청",
            MethodPromptTagEnum.ANALYZE: "메서드의 동작 및 잠재적 문제에 대한 분석 요청",
            MethodPromptTagEnum.IMPLEMENT: "메서드 시그니처에 대한 구현 제안 요청"
        }
        
        return EnumPromptBuilder._format_enum_prompt("메서드 프롬프트 태그", MethodPromptTagEnum, descriptions)

    @staticmethod
    def build_method_prompt_target_enum_prompt() -> str:
        """
        MethodPromptTargetEnum 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 메서드 프롬프트 대상을 설명하는 형식화된 프롬프트
        """
        descriptions = {
            MethodPromptTargetEnum.SIGNATURE: "메서드 시그니처 대상 (이름, 매개변수, 반환 유형)",
            MethodPromptTargetEnum.BODY: "메서드 본문 대상 (구현)"
        }
        
        return EnumPromptBuilder._format_enum_prompt("메서드 프롬프트 대상", MethodPromptTargetEnum, descriptions)
    
    @staticmethod
    def build_prompt_response_enum_prompt() -> str:
        """
        PromptResponseEnum 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 프롬프트 응답 유형을 설명하는 형식화된 프롬프트
        """
        descriptions = {
            PromptResponseEnum.MODIFIED: "프롬프트에 기반하여 컴포넌트가 수정됨",
            PromptResponseEnum.UNCHANGED: "컴포넌트가 변경되지 않음",
            PromptResponseEnum.EXPLANATION: "수정 없이 설명만 제공됨",
            PromptResponseEnum.MODIFIED_WITH_NEW_COMPONENTS: "컴포넌트가 수정되고 새 컴포넌트가 추가됨",
            PromptResponseEnum.ERROR: "처리 중 오류 발생"
        }
        
        return EnumPromptBuilder._format_enum_prompt("프롬프트 응답 유형", PromptResponseEnum, descriptions)
    
    @staticmethod
    def build_method_connection_type_enum_prompt() -> str:
        """
        MethodConnectionTypeEnum 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 메서드 연결 유형을 설명하는 형식화된 프롬프트
        """
        descriptions = {
            MethodConnectionTypeEnum.SOLID: "실선 연결 (강한 관계, 직접 호출, 상속)",
            MethodConnectionTypeEnum.DOTTED: "점선 연결 (약한 관계, 인터페이스 구현, 의존성)"
        }
        
        return EnumPromptBuilder._format_enum_prompt("메서드 연결 유형", MethodConnectionTypeEnum, descriptions)
    
    @staticmethod
    def build_component_type_enum_prompt() -> str:
        """
        ComponentTypeEnum 값에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 각 컴포넌트 유형을 설명하는 형식화된 프롬프트
        """
        descriptions = {
            ComponentTypeEnum.CLASS: "구체적인 클래스 구현",
            ComponentTypeEnum.INTERFACE: "인터페이스 정의 (추상 계약)"
        }
        
        return EnumPromptBuilder._format_enum_prompt("컴포넌트 유형", ComponentTypeEnum, descriptions)
    
    @staticmethod
    def build_all_enums_prompt() -> str:
        """
        사용 가능한 모든 enum 유형에 대한 설명 프롬프트를 생성합니다.
        
        Returns:
            str: 모든 enum 유형을 설명하는 형식화된 프롬프트
        """
        prompts = [
            EnumPromptBuilder.build_file_type_enum_prompt(),
            EnumPromptBuilder.build_method_prompt_tag_enum_prompt(),
            EnumPromptBuilder.build_method_prompt_target_enum_prompt(),
            EnumPromptBuilder.build_prompt_response_enum_prompt(),
            EnumPromptBuilder.build_method_connection_type_enum_prompt(),
            EnumPromptBuilder.build_component_type_enum_prompt()
        ]
        
        return "\n\n".join(prompts)
    
    @staticmethod
    def build_enum_prompt(enum_class: Type[Enum]) -> str:
        """
        특정 enum 클래스에 대한 설명 프롬프트를 생성합니다.
        
        Args:
            enum_class: 프롬프트를 생성할 Enum 클래스
            
        Returns:
            str: 지정된 enum에 대한 형식화된 프롬프트 또는 지원되지 않는 경우 오류 메시지
        """
        if enum_class == FileTypeEnumDto:
            return EnumPromptBuilder.build_file_type_enum_prompt()
        elif enum_class == MethodPromptTagEnum:
            return EnumPromptBuilder.build_method_prompt_tag_enum_prompt()
        elif enum_class == MethodPromptTargetEnum:
            return EnumPromptBuilder.build_method_prompt_target_enum_prompt()
        elif enum_class == PromptResponseEnum:
            return EnumPromptBuilder.build_prompt_response_enum_prompt()
        elif enum_class == MethodConnectionTypeEnum:
            return EnumPromptBuilder.build_method_connection_type_enum_prompt()
        elif enum_class == ComponentTypeEnum:
            return EnumPromptBuilder.build_component_type_enum_prompt()
        else:
            return f"Enum 클래스 {enum_class.__name__}는 EnumPromptBuilder에서 지원되지 않습니다"
            
    @staticmethod
    def _format_enum_prompt(title: str, enum_class: Type[Enum], descriptions: Dict[Enum, str]) -> str:
        """
        일관된 스타일로 enum 프롬프트를 형식화하는 헬퍼 메서드입니다.
        
        Args:
            title: 이 enum 그룹의 제목
            enum_class: 설명되는 Enum 클래스
            descriptions: enum 값을 설명에 매핑하는 딕셔너리
            
        Returns:
            str: enum에 대한 형식화된 프롬프트 섹션
        """
        result = f"{title} ({enum_class.__name__}):\n"
        
        for enum_value in enum_class:
            description = descriptions.get(enum_value, "설명이 없습니다")
            result += f"- {enum_value.name}: {description}\n"
            
        return result