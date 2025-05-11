from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class UserChatRequest(BaseModel):
    class MethodPromptTag(str, Enum):
        EXPLAIN = "EXPLAIN"
        REFACTORING = "REFACTORING"
        OPTIMIZE = "OPTIMIZE"
        DOCUMENT = "DOCUMENT"
        CONVENTION = "CONVENTION"
        ANALYZE = "ANALYZE"
        IMPLEMENT = "IMPLEMENT"

    class MethodPromptTarget(str, Enum):
        SIGNATURE = "SIGNATURE"
        BODY = "BODY"

    tag: MethodPromptTag
    promptType: MethodPromptTarget
    message: str
    targetMethods: list[Dict[str, str]]

class DiagramResponse(BaseModel):
    diagramId: str
    version: int
    metadata: dict
    components: list[dict]
    edges: list[dict]
    apiId: str
    projectId: str

class Diagram(BaseModel):
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



    projectId: str
    apiId: str
    diagramId: str
    components: List[ComponentResponse]
    connections: List[ConnectionResponse]
    dto: List[DtoModelResponse]
    metadata: MetadataResponse

class PositionRequest(BaseModel):
    x: float
    y: float