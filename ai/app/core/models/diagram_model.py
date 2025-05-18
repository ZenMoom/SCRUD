from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class MethodChainPayload(BaseModel):
    methodId: str = Field(None, description="메서드의 아이디 (uuid4)")
    name: Optional[str] = Field(None, description="메서드의 이름")
    signature: Optional[str] = Field(None, description="메서드의 서명(파라미터 및 반환 타입)")
    body: Optional[str] = Field(None, description="메서드의 구현 내용")
    description: Optional[str] = Field(None, description="메서드에 대한 설명")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "methodId": "12345678-1234-1234-1234-123456789012",
                "name": "getUserById",
                "signature": "getUserById(id: string): User",
                "body": "return this.userRepository.findById(id);",
                "description": "주어진 ID로 사용자 정보를 조회하는 메서드"
            }
        }
    )


class ComponentChainPayload(BaseModel):
    class ComponentTypeEnum(str, Enum):
        CLASS = "CLASS"
        INTERFACE = "INTERFACE"

    type: ComponentTypeEnum = Field(..., description="컴포넌트 타입 (CLASS, INTERFACE)")
    name: str = Field(..., description="컴포넌트 이름")
    description: Optional[str] = Field(None, description="컴포넌트 설명")
    positionX: Optional[float] = Field(None, description="컴포넌트 X 위치")
    positionY: Optional[float] = Field(None, description="컴포넌트 Y 위치")
    methods: Optional[List[MethodChainPayload]] = Field(None, description="컴포넌트의 메서드 목록")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "type": "CLASS",
                "name": "UserService",
                "description": "사용자 관련 서비스를 제공하는 클래스",
                "positionX": 100.0,
                "positionY": 200.0,
                "methods": [
                    {
                        "methodId": "12345678-1234-1234-1234-123456789012",
                        "name": "getUserById",
                        "signature": "getUserById(id: string): User",
                        "body": "return this.userRepository.findById(id);",
                        "description": "주어진 ID로 사용자 정보를 조회하는 메서드"
                    }
                ]
            }
        }
    )


class ConnectionChainPayload(BaseModel):
    class MethodConnectionTypeEnum(str, Enum):
        SOLID = "SOLID"
        DOTTED = "DOTTED"

    sourceMethodId: Optional[str] = Field(None, description="소스 메서드 ID")
    targetMethodId: Optional[str] = Field(None, description="대상 메서드 ID")
    type: Optional[MethodConnectionTypeEnum] = Field(None, description="연결 타입 (SOLID, DOTTED)")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "sourceMethodId": "12345678-1234-1234-1234-123456789012",
                "targetMethodId": "87654321-4321-4321-4321-210987654321",
                "type": "SOLID"
            }
        }
    )


class DtoModelChainPayload(BaseModel):
    name: str = Field(..., description="DTO 모델 이름")
    description: Optional[str] = Field(None, description="DTO 모델 설명")
    body: Optional[str] = Field(None, description="DTO 모델 정의 내용")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "name": "UserDto",
                "description": "사용자 정보를 전달하기 위한 DTO 모델",
                "body": "class UserDto { id: string; name: string; email: string; }"
            }
        }
    )


class DiagramChainPayload(BaseModel):
    components: Optional[List[ComponentChainPayload]] = Field([], description="다이어그램의 컴포넌트 목록")
    connections: Optional[List[ConnectionChainPayload]] = Field([], description="다이어그램의 연결 목록")
    dto: Optional[List[DtoModelChainPayload]] = Field([], description="다이어그램에 사용되는 DTO 모델 목록")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "components": [
                    {
                        "type": "CLASS",
                        "name": "UserService",
                        "description": "사용자 관련 서비스를 제공하는 클래스",
                        "positionX": 100.0,
                        "positionY": 200.0,
                        "methods": [
                            {
                                "methodId": "12345678-1234-1234-1234-123456789012",
                                "name": "getUserById",
                                "signature": "getUserById(id: string): User",
                                "body": "return this.userRepository.findById(id);",
                                "description": "주어진 ID로 사용자 정보를 조회하는 메서드"
                            }
                        ]
                    }
                ],
                "connections": [
                    {
                        "sourceMethodId": "12345678-1234-1234-1234-123456789012",
                        "targetMethodId": "87654321-4321-4321-4321-210987654321",
                        "type": "SOLID"
                    }
                ],
                "dto": [
                    {
                        "name": "UserDto",
                        "description": "사용자 정보를 전달하기 위한 DTO 모델",
                        "body": "class UserDto { id: string; name: string; email: string; }"
                    }
                ]
            }
        }
    )


class ApiSummary(BaseModel):
    class ApiProcessStateEnum(str, Enum):
        AI_GENERATED = "AI_GENERATED"
        AI_VISUALIZED = "AI_VISUALIZED"
        USER_COMPLETED = "USER_COMPLETED"

    name: str = Field(..., description="API 이름")
    description: Optional[str] = Field(None, description="API 설명")
    method: Optional[str] = Field(None, description="HTTP 메서드 (GET, POST, PUT, DELETE 등)")
    endpoint: Optional[str] = Field(None, description="API 엔드포인트")
    status: Optional[ApiProcessStateEnum] = Field(None, description="API 상태")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "name": "사용자 조회 API",
                "description": "특정 ID를 가진 사용자를 조회하는 API",
                "method": "GET",
                "endpoint": "/api/users/{id}",
                "status": "AI_GENERATED"
            }
        }
    )
