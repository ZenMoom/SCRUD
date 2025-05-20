from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict

from pydantic import BaseModel, Field, ConfigDict


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

    model_config = ConfigDict(
        from_attributes=True,
    )


class ChatResponse(BaseModel):
    class UserChatResponse(BaseModel):
        id: Optional[str] = Field(default=None, alias="_id")
        tag: MethodPromptTagEnum
        promptType: MethodPromptTargetEnum
        message: str
        targetMethods: List[Dict[str, str]]  # methodId를 포함하는 사전 목록

        model_config = ConfigDict(
            from_attributes=True,
        )

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

            model_config = ConfigDict(
                from_attributes=True,
            )

        systemChatId: Optional[str] = None
        status: PromptResponseEnum
        message: str
        versionInfo: Optional[VersionInfo] = None
        diagramId: Optional[str] = None

        model_config = ConfigDict(
            from_attributes=True,
        )

    chatId: Optional[str] = None
    createdAt: datetime
    userChat: Optional[UserChatResponse] = None
    systemChat: Optional[SystemChatResponse] = None

    model_config = ConfigDict(
        from_attributes=True,
    )

class ChatResponseList(BaseModel):
    content: List[ChatResponse] = []

    model_config = ConfigDict(
        from_attributes=True,
    )


class DiagramResponse(BaseModel):
    class MetadataResponse(BaseModel):
        metadataId: str
        version: int
        lastModified: datetime
        name: Optional[str] = None
        description: Optional[str] = None

        model_config = ConfigDict(
            from_attributes=True,
        )

    class DtoModelResponse(BaseModel):
        dtoId: str
        name: str
        description: Optional[str] = None
        body: Optional[str] = None

        model_config = ConfigDict(
            from_attributes=True,
        )

    class ConnectionResponse(BaseModel):
        class MethodConnectionTypeEnum(str, Enum):
            SOLID = "SOLID"
            DOTTED = "DOTTED"

        connectionId: Optional[str] = None
        sourceMethodId: Optional[str] = None
        targetMethodId: Optional[str] = None
        type: Optional[MethodConnectionTypeEnum] = []

        model_config = ConfigDict(
            from_attributes=True,
        )

    class ComponentResponse(BaseModel):
        class Method(BaseModel):
            methodId: str
            name: str
            signature: str
            body: Optional[str] = None
            description: Optional[str] = None

            model_config = ConfigDict(
                from_attributes=True,
            )

        class ComponentTypeEnum(str, Enum):
            CLASS = "CLASS"
            INTERFACE = "INTERFACE"

        componentId: str
        type: ComponentTypeEnum
        name: str
        description: Optional[str] = None
        positionX: float
        positionY: float
        methods: List[Optional[Method]] = []

        model_config = ConfigDict(
            from_attributes=True,
        )
    projectId: Optional[str] = None
    apiId: Optional[str] = None
    diagramId: str
    components: Optional[List[ComponentResponse]] = []
    connections: Optional[List[ConnectionResponse]] = []
    dto: Optional[List[DtoModelResponse]] = []
    metadata: MetadataResponse

    model_config = ConfigDict(
        from_attributes=True,
    )


class PositionRequest(BaseModel):
    x: float
    y: float
