from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

from pydantic import BaseModel, Field


class MethodPromptTagEnum(str, Enum):
    EXPLAIN = "EXPLAIN"
    REFACTORING = "REFACTORING"
    OPTIMIZE = "OPTIMIZE"
    DOCUMENT = "DOCUMENT"
    CONVENTION = "CONVENTION"
    ANALYZE = "ANALYZE"
    IMPLEMENT = "IMPLEMENT"


class MethodPromptTargetEnum(str, Enum):
    SIGNATURE = "SIGNATURE"
    BODY = "BODY"


class UserChatRequest(BaseModel):
    tag: MethodPromptTagEnum
    promptType: MethodPromptTargetEnum
    message: str
    targetMethods: list[Dict[str, str]]


class ChatResponse(BaseModel):
    class UserChatResponse(BaseModel):
        id: Optional[str] = Field(default=None, alias="_id")
        tag: MethodPromptTagEnum
        promptType: MethodPromptTargetEnum
        message: str
        targetMethods: List[Dict[str, str]]  # methodId를 포함하는 사전 목록

    class SystemChatResponse(BaseModel):
        class PromptResponseEnum(str, Enum):
            MODIFIED = "MODIFIED"
            UNCHANGED = "UNCHANGED"
            EXPLANATION = "EXPLANATION"
            MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
            ERROR = "ERROR"

        class VersionInfo(BaseModel):
            newVersionId: str
            description: Optional[str] = None

        systemChatId: Optional[str] = None
        status: PromptResponseEnum
        message: str
        versionInfo: Optional[VersionInfo] = None
        diagramId: Optional[str] = None

    chatId: Optional[str] = None
    createdAt: datetime
    userChat: Optional[UserChatResponse] = None
    systemChat: Optional[SystemChatResponse] = None


class ChatResponseList(BaseModel):
    content: List[ChatResponse] = []


class DiagramResponse(BaseModel):
    class MetadataResponse(BaseModel):
        metadataId: str
        version: int
        lastModified: datetime
        name: Optional[str] = None
        description: Optional[str] = None



    class DtoModelResponse(BaseModel):
        dtoId: str
        name: str
        description: Optional[str] = None
        body: Optional[str] = None

    class ConnectionResponse(BaseModel):
        class MethodConnectionTypeEnum(str, Enum):
            SOLID = "SOLID"
            DOTTED = "DOTTED"

        connectionId: str
        sourceMethodId: str
        targetMethodId: str
        type: MethodConnectionTypeEnum

    class ComponentResponse(BaseModel):
        class Method(BaseModel):
            methodId: str
            name: str
            signature: str
            body: Optional[str] = None
            description: Optional[str] = None

        class ComponentTypeEnum(str, Enum):
            CLASS = "CLASS"
            INTERFACE = "INTERFACE"

        componentId: str
        type: ComponentTypeEnum
        name: str
        description: Optional[str] = None
        positionX: float
        positionY: float
        methods: List[Method]

    projectId: Optional[str] = None
    apiId: Optional[str] = None
    diagramId: str
    components: List[ComponentResponse]
    connections: List[ConnectionResponse]
    dto: List[DtoModelResponse]
    metadata: MetadataResponse


class PositionRequest(BaseModel):
    x: float
    y: float
