from app.core.models.diagram_model import DiagramChainPayload
from app.core.models.global_setting_model import GlobalFileListChainPayload, ApiSpecChainPayload
from app.core.models.user_chat_model import UserChatChainPayload, SystemChatChainPayload
from app.infrastructure.http.client.api_client import ApiSpec


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
            prompt += f"""### 프로젝트 정보
제목: {project.title or "정보 없음"}
설명: {project.description or "정보 없음"}
서버 URL: {project.serverUrl or "정보 없음"}
최종 업데이트: {project.updatedAt or "정보 없음"}

"""
        
        if not global_files.content or len(global_files.content) == 0:
            prompt += "글로벌 파일이 존재하지 않습니다.\n"
        else:
            prompt += "### 글로벌 파일 목록\n\n"
            for idx, file in enumerate(global_files.content):
                prompt += f"""#### 파일 {idx + 1}
파일명: {file.fileName or "정보 없음"}
파일 유형: {file.fileType or "정보 없음"}
파일 URL: {file.fileUrl or "정보 없음"}

파일 내용:
```
{file.fileContent or "내용 없음"}
```

"""
        
        return prompt

    @staticmethod
    def build_diagram_prompt(
            current_diagram: DiagramChainPayload,
    ) -> str:
        """
        다이어그램 정보로부터 프롬프트를 생성합니다.
        
        Args:
            current_diagram: 다이어그램 정보를 담은 DiagramChainPayload 객체
            
        Returns:
            다이어그램에 대한 프롬프트 문자열
        """
        prompt = """## 현재 다이어그램 상태\n\n"""
        
        # 컴포넌트 정보 추가
        if not current_diagram.components or len(current_diagram.components) == 0:
            prompt += "### 컴포넌트\n컴포넌트가 존재하지 않습니다.\n\n"
        else:
            prompt += "### 컴포넌트\n\n"
            for idx, component in enumerate(current_diagram.components):
                prompt += f"""#### {component.type}: {component.name}
설명: {component.description or "설명 없음"}
위치: X={component.positionX or "미지정"}, Y={component.positionY or "미지정"}

"""
                if component.methods and len(component.methods) > 0:
                    prompt += "##### 메서드 목록\n"
                    for midx, method in enumerate(component.methods):
                        prompt += f"""###### 메서드 {midx + 1}: {method.name or "이름 없음"}
메서드 ID: {method.methodId or "정보 없음"}
서명: {method.signature or "정보 없음"}
설명: {method.description or "설명 없음"}

본문:
```
{method.body or "구현 정보 없음"}
```

"""
                else:
                    prompt += "메서드가 없습니다.\n\n"
        
        # 연결 정보 추가
        if not current_diagram.connections or len(current_diagram.connections) == 0:
            prompt += "### 연결\n연결이 존재하지 않습니다.\n\n"
        else:
            prompt += "### 연결\n\n"
            for idx, connection in enumerate(current_diagram.connections):
                prompt += f"""#### 연결 {idx + 1}
유형: {connection.type.value if connection.type else "정보 없음"}
소스 메서드 ID: {connection.sourceMethodId or "정보 없음"}
대상 메서드 ID: {connection.targetMethodId or "정보 없음"}

"""
        
        # DTO 모델 정보 추가
        if not current_diagram.dto or len(current_diagram.dto) == 0:
            prompt += "### DTO 모델\nDTO 모델이 존재하지 않습니다.\n"
        else:
            prompt += "### DTO 모델\n\n"
            for idx, dto in enumerate(current_diagram.dto):
                prompt += f"""#### DTO {idx + 1}: {dto.name}
설명: {dto.description or "설명 없음"}

본문:
```
{dto.body or "정의 정보 없음"}
```

"""
        
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