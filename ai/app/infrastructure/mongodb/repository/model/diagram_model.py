from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict

from pydantic import BaseModel, Field


# 열거형(Enum) 정의
class ApiProcessStateEnum(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    AI_VISUALIZED = "AI_VISUALIZED"
    USER_COMPLETED = "USER_COMPLETED"


class MethodPromptTagEnum(str, Enum):
    EXPLAIN = "EXPLAIN"
    REFACTORING = "REFACTORING"
    OPTIMIZE = "OPTIMIZE"
    DOCUMENT = "DOCUMENT"
    TEST = "TEST"
    SECURITY = "SECURITY"
    CONVENTION = "CONVENTION"
    ANALYZE = "ANALYZE"
    IMPLEMENT = "IMPLEMENT"


class MethodPromptTargetEnum(str, Enum):
    SIGNATURE = "SIGNATURE"
    BODY = "BODY"


class PromptResponseEnum(str, Enum):
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"
    EXPLANATION = "EXPLANATION"
    MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
    ERROR = "ERROR"


class ComponentTypeEnum(str, Enum):
    CLASS = "CLASS"
    INTERFACE = "INTERFACE"


class MethodConnectionTypeEnum(str, Enum):
    SOLID = "SOLID"
    DOTTED = "DOTTED"


# 기본 모델 정의
class ApiSummary(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    apiId: str
    name: str
    description: str
    method: str
    endpoint: str
    status: ApiProcessStateEnum

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Method(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    methodId: str
    name: str
    signature: str
    body: Optional[str] = None
    description: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Component(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    componentId: str
    type: ComponentTypeEnum
    name: str
    description: Optional[str] = None
    positionX: float
    positionY: float
    methods: List[Method]

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Connection(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    connectionId: str
    sourceMethodId: str
    targetMethodId: str
    type: MethodConnectionTypeEnum

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DtoModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    dtoId: str
    name: str
    description: Optional[str] = None
    body: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Metadata(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    metadataId: str
    version: int
    lastModified: datetime
    name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class VersionInfo(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    newVersionId: str
    description: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserChat(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    tag: MethodPromptTagEnum
    promptType: MethodPromptTargetEnum
    message: str
    targetMethods: List[Dict[str, str]]  # methodId를 포함하는 사전 목록

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SystemChat(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    systemChatId: Optional[str] = None
    status: PromptResponseEnum
    message: str
    versionInfo: Optional[VersionInfo] = None
    diagramId: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Chat(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    chatId: Optional[str] = None
    projectId: str
    apiId: str
    userChat: Optional[UserChat] = None
    systemChat: Optional[SystemChat] = None
    createdAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Diagram(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    projectId: Optional[str] = None
    apiId: Optional[str] = None
    diagramId: str
    components: List[Component]
    connections: List[Connection]
    dto: List[DtoModel]
    metadata: Metadata

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def validate_diagram_ids(self) -> bool:
        """다이어그램 내 ID 중복을 검사하는 메서드"""
        # 컴포넌트 ID 검사
        component_ids = [c.componentId for c in self.components]
        if len(component_ids) != len(set(component_ids)):
            return False

        # 메소드 ID 검사
        method_ids = [m.methodId for c in self.components for m in c.methods]
        if len(method_ids) != len(set(method_ids)):
            return False

        # 커넥션 ID 검사
        connection_ids = [c.connectionId for c in self.connections]
        if len(connection_ids) != len(set(connection_ids)):
            return False

        return True
