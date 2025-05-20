from typing import List

from app.core.models.diagram_model import DiagramChainPayload, ComponentChainPayload, DtoModelChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload, ApiSpecChainPayload
from app.core.models.user_chat_model import UserChatChainPayload, SystemChatChainPayload


class PromptBuilder:
    @staticmethod
    def build_api_spec_prompt(
            api_spec: ApiSpecChainPayload,
    ) -> str:
        """
        API 스펙 정보로부터 프롬프트를 생성합니다.
        
        Args:
            api_spec: API 스펙 정보를 담은 ApiSpec 객체
            
        Returns:
            API 스펙에 대한 프롬프트 문자열
        """
        prompt = f"""## API 스펙 정보
        
API 요약: {api_spec.summary or "정보 없음"}
HTTP 메서드: {api_spec.httpMethod or "정보 없음"}
엔드포인트: {api_spec.endpoint or "정보 없음"}
API 그룹: {api_spec.apiGroup or "정보 없음"}
API 버전: {str(api_spec.version or "정보 없음")}
API 스펙 버전 ID: {str(api_spec.apiSpecVersionId or "정보 없음")}

## 상세 정보
설명: {api_spec.description or "정보 없음"}

## 매개변수
경로 매개변수: {api_spec.pathParameters or "없음"}
쿼리 매개변수: {api_spec.queryParameters or "없음"}

## 요청과 응답
요청 본문: {api_spec.requestBody or "없음"}
응답 데이터: {api_spec.response or "없음"}
"""
        return prompt

    @staticmethod
    def build_user_chat_prompt(
            chat_data: UserChatChainPayload,
    ) -> str:
        """
        사용자 채팅 데이터로부터 프롬프트를 생성합니다.
        
        Args:
            chat_data: 사용자 채팅 정보를 담은 UserChatChainPayload 객체
            
        Returns:
            사용자 채팅에 대한 프롬프트 문자열
        """
        prompt = f"""## 사용자 요청 정보
        
메시지: {chat_data.message or "정보 없음"}
요청 태그: {chat_data.tag.value if chat_data.tag else "지정되지 않음"}
프롬프트 타입: {chat_data.promptType.value if chat_data.promptType else "지정되지 않음"}

## 선택한 메서드 정보
"""
        
        if not chat_data.targetMethods or len(chat_data.targetMethods) == 0:
            prompt += "메서드가 지정되지 않았습니다.\n"
        else:
            for idx, method in enumerate(chat_data.targetMethods):
                prompt += f"""
### 메서드 {idx + 1}
메서드 ID: {method.methodId or "정보 없음"}
이름: {method.name or "정보 없음"}
서명: {method.signature or "정보 없음"}
설명: {method.description or "정보 없음"}

본문:
```
{method.body or "구현 정보 없음"}
```
"""
        
        return prompt

    @staticmethod
    def build_global_file_list_prompt(
            global_files: GlobalFileListChainPayload,
    ) -> str:
        """
        글로벌 파일 리스트로부터 프롬프트를 생성합니다.
        
        Args:
            global_files: 글로벌 파일 리스트 정보를 담은 GlobalFileListChainPayload 객체
            
        Returns:
            글로벌 파일 리스트에 대한 프롬프트 문자열
        """
        prompt = """## 프로젝트 글로벌 파일 정보\n\n"""
        
        if global_files.project:
            project = global_files.project
            prompt += f"""
[프로젝트 정보]
제목: {project.title or "정보 없음"}
설명: {project.description or "정보 없음"}
서버 URL: {project.serverUrl or "정보 없음"}
"""
        
        if not global_files.content or len(global_files.content) == 0:
            prompt += "글로벌 파일이 존재하지 않습니다.\n"
        else:

            prompt += "[글로벌 파일 목록]\n\n"
            for idx, file in enumerate(global_files.content):
                file_type_description = "정보 없음"

                # 파일 유형에 따라 설명 추가
                if file.fileType:
                    try:
                        file_type = file.fileType

                        if file_type == "REQUIREMENTS":
                            file_type_description = "요구사항 문서"
                        elif file_type == "ERD":
                            file_type_description = "Database Entity Table"
                        elif file_type == "UTIL":
                            file_type_description = "유틸리티 관련 파일"
                        elif file_type == "CONVENTION":
                            file_type_description = "코딩 컨벤션 관련 파일"
                        elif file_type == "CONVENTION_DEFAULT":
                            file_type_description = "기본 코딩 컨벤션 파일"
                        elif file_type == "DEPENDENCY":
                            file_type_description = "의존성 관련 파일"
                        elif file_type == "ERROR_CODE":
                            file_type_description = "에러 코드 정의 파일"
                        elif file_type == "SECURITY":
                            file_type_description = "보안 관련 파일"
                        elif file_type == "SECURITY_DEFAULT_JWT":
                            file_type_description = "JWT 기반 기본 보안 설정 파일"
                        elif file_type == "SECURITY_DEFAULT_SESSION":
                            file_type_description = "세션 기반 기본 보안 설정 파일"
                        elif file_type == "SECURITY_DEFAULT_NONE":
                            file_type_description = "보안 설정이 없는 기본 파일"
                        elif file_type == "ARCHITECTURE_GITHUB":
                            file_type_description = "GitHub 관련 아키텍처 파일"
                        elif file_type == "ARCHITECTURE_DEFAULT_LAYERED_A":
                            file_type_description = "기본 계층형 아키텍처 A 파일"
                        elif file_type == "ARCHITECTURE_DEFAULT_LAYERED_B":
                            file_type_description = "기본 계층형 아키텍처 B 파일"
                        elif file_type == "ARCHITECTURE_DEFAULT_CLEAN":
                            file_type_description = "기본 클린 아키텍처 파일"
                        elif file_type == "ARCHITECTURE_DEFAULT_MSA":
                            file_type_description = "기본 마이크로서비스 아키텍처 파일"
                        elif file_type == "ARCHITECTURE_DEFAULT_HEX":
                            file_type_description = "기본 헥사고날 아키텍처 파일"
                    except ValueError:
                        file_type_description = f"알 수 없는 파일 유형: {file.fileType}"

                prompt += f"""####
파일 {idx + 1}
파일명: {file.fileName or "정보 없음"}
파일 유형: {file.fileType or "정보 없음"} ({file_type_description})
파일 URL: {file.fileUrl or ""}

파일 내용:
{file.fileContent or "내용 없음"}
            """

        return prompt

    @staticmethod
    def build_component_prompt(component_payloads: List[ComponentChainPayload]) -> str:
        if not component_payloads:
            return "### 컴포넌트\n컴포넌트가 존재하지 않습니다.\n\n"

        prompt = "### 컴포넌트\n\n"
        for idx, component in enumerate(component_payloads):
            prompt += f"""#### {component.type}: {component.name}
설명: {component.description or "설명 없음"}
위치: X={component.positionX or 0}, Y={component.positionY or 0}

"""
            if component.methods:
                prompt += "##### 메서드 목록\n"
                for midx, method in enumerate(component.methods):
                    prompt += f"""###### 메서드 {midx + 1}: {method.name or "이름 없음"}
메서드 ID: {method.methodId or "정보 없음"}
서명: {method.signature or "정보 없음"}
설명: {method.description or "설명 없음"}

본문:
{method.body or "구현 정보 없음"}
"""
            else:
                prompt += "메서드가 없습니다.\n\n"
        return prompt

    @staticmethod
    def build_dto_prompt(dto_payload: List[DtoModelChainPayload]) -> str:


        prompt = "### DTO 모델\n\n"
        for idx, dto in enumerate(dto_payload):
            prompt += f"""#### DTO {idx + 1}: {dto.name}
설명: {dto.description or "설명 없음"}

본문:
{dto.body or "정의 정보 없음"}
"""
        return prompt

    @staticmethod
    def build_diagram_prompt(current_diagram: DiagramChainPayload) -> str:
        """
        다이어그램 정보로부터 프롬프트를 생성합니다.

        Args:
            current_diagram: 다이어그램 정보를 담은 DiagramChainPayload 객체

        Returns:
            다이어그램에 대한 프롬프트 문자열
        """
        prompt = "## 현재 다이어그램 상태\n\n"
        prompt += PromptBuilder.build_component_prompt(current_diagram.components)

        # 연결 정보
        if not current_diagram.connections:
            prompt += "### 연결\n연결이 존재하지 않습니다.\n\n"
        else:
            prompt += "### 연결\n\n"
            for idx, connection in enumerate(current_diagram.connections):
                prompt += f"""#### 연결 {idx + 1}
유형: {connection.type if connection.type else "정보 없음"}
소스 메서드 ID: {connection.sourceMethodId or "정보 없음"}
대상 메서드 ID: {connection.targetMethodId or "정보 없음"}

"""

        prompt += PromptBuilder.build_dto_prompt(current_diagram.dto)
        return prompt
        
    @staticmethod
    def build_system_chat_prompt(
            system_chat: SystemChatChainPayload,
    ) -> str:
        """
        시스템 응답 데이터로부터 프롬프트를 생성합니다.
        
        Args:
            system_chat: 시스템 응답 정보를 담은 SystemChatChainPayload 객체
            
        Returns:
            시스템 응답에 대한 프롬프트 문자열
        """
        prompt = """## 시스템 응답 정보\n\n"""
        
        if system_chat.status:
            prompt += f"""### 응답 상태
상태: {system_chat.status.value}

상태 설명:
"""
            # 상태별 설명 추가
            if system_chat.status.value == "MODIFIED":
                prompt += "다이어그램이 사용자 요청에 따라 수정되었습니다.\n"
            elif system_chat.status.value == "UNCHANGED":
                prompt += "사용자 요청으로 인한 다이어그램 변경이 필요하지 않습니다.\n"
            elif system_chat.status.value == "EXPLANATION":
                prompt += "다이어그램에 대한 설명이나 분석 결과만 제공합니다.\n"
            elif system_chat.status.value == "MODIFIED_WITH_NEW_COMPONENTS":
                prompt += "다이어그램이 수정되었으며, 새로운 컴포넌트가 추가되었습니다.\n"
            elif system_chat.status.value == "ERROR":
                prompt += "처리 중 예외 상황이 발생했습니다.\n"
        else:
            prompt += "### 응답 상태\n상태가 지정되지 않았습니다.\n\n"
            
        prompt += f"""
### 응답 메시지
{system_chat.message or "메시지가 없습니다."}
"""
        
        return prompt