from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ComponentType(str, Enum):
    CLASS = "CLASS"
    INTERFACE = "INTERFACE"

# 메서드 모델
class Method(BaseModel):
    methodId: str
    name: str
    signature: str
    body: Optional[str] = None
    description: Optional[str] = None

# 컴포넌트 모델
class Component(BaseModel):
    componentId: str
    type: ComponentType
    name: str
    description: Optional[str] = None
    positionX: float
    positionY: float
    methods: list[Method]

class MethodConnectionType(str, Enum):
    SOLID = "SOLID"
    DOTTED = "DOTTED"

# 연결 모델
class Connection(BaseModel):
    connectionId: str
    sourceMethodId: str
    targetMethodId: str
    type: MethodConnectionType

# 메타데이터 모델
class Metadata(BaseModel):
    metadataId: Optional[str] = None
    version: str
    lastModified: Optional[datetime] = None
    name: Optional[str] = None
    description: Optional[str] = None

# DTO 모델
class DtoModel(BaseModel):
    dtoId: str
    name: str
    description: Optional[str] = None
    body: Optional[str] = None

# 다이어그램 모델
class DiagramRequest(BaseModel):
    diagramId: str
    components: list[Component]
    connections: list[Connection]
    dto: list[DtoModel]
    metadata: Metadata