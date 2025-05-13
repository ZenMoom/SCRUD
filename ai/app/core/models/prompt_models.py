from pydantic import Field, BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enum 정의
class ApiProcessState(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    AI_VISUALIZED = "AI_VISUALIZED"
    USER_COMPLETED = "USER_COMPLETED"


class MethodPromptTag(str, Enum):
    EXPLAIN = "EXPLAIN"
    REFACTORING = "REFACTORING"
    OPTIMIZE = "OPTIMIZE"
    DOCUMENT = "DOCUMENT"
    TEST = "TEST"
    SECURITY = "SECURITY"
    CONVENTION = "CONVENTION"
    ANALYZE = "ANALYZE"
    IMPLEMENT = "IMPLEMENT"


class MethodPromptTarget(str, Enum):
    SIGNATURE = "SIGNATURE"
    BODY = "BODY"


class PromptResponseEnum(str, Enum):
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"
    EXPLANATION = "EXPLANATION"
    MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
    ERROR = "ERROR"


class ComponentType(str, Enum):
    CLASS = "CLASS"
    INTERFACE = "INTERFACE"


class MethodConnectionType(str, Enum):
    SOLID = "SOLID"
    DOTTED = "DOTTED"



# 페이지 관련 모델
class PageDto(BaseModel):
    listSize: int
    isFirstPage: bool
    isLastPage: bool
    totalPages: int
    totalElements: int


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


# 연결 모델
class Connection(BaseModel):
    connectionId: str
    sourceMethodId: str
    targetMethodId: str
    type: MethodConnectionType


# DTO 모델
class DtoModel(BaseModel):
    dtoId: str
    name: str
    description: Optional[str] = None
    body: Optional[str] = None


# 메타데이터 모델
class Metadata(BaseModel):
    metadataId: Optional[str] = None
    version: str
    lastModified: datetime
    name: Optional[str] = None
    description: Optional[str] = None


# API 요약 모델
class ApiSummary(BaseModel):
    apiId: str
    name: str
    status: ApiProcessState
    description: Optional[str] = None


# 다이어그램 모델
class Diagram(BaseModel):
    diagramId: str
    components: list[Component]
    connections: list[Connection]
    dto: list[DtoModel]
    metadata: Metadata


# 버전 정보 모델
class VersionInfo(BaseModel):
    newVersionId: str
    description: Optional[str] = None


# 사용자 채팅 모델
class UserChat(BaseModel):
    tag: MethodPromptTag
    promptType: MethodPromptTarget
    message: str
    targetMethods: list[Dict[str, str]]


# 시스템 채팅 모델
class SystemChat(BaseModel):
    systemChatId: Optional[str] = None
    status: PromptResponseEnum
    versionInfo: Optional[VersionInfo] = None
    diagramData: Optional[Diagram] = None


# 채팅 모델
class Chat(BaseModel):
    chatId: str
    projectId: str
    apiId: str
    createdAt: datetime
    userChat: UserChat
    systemChat: Optional[SystemChat] = None


# 프로젝트 관련 모델
class Project(BaseModel):
    name: str
    description: Optional[str] = None
    serverUrl: Optional[str] = None
    requirementSpecification: Optional[str] = None
    erd: Optional[str] = None
    dependencyFile: Optional[str] = None
    utilClasses: Optional[list[str]] = None
    exceptionHandling: Optional[str] = None
    errorCodeDefinition: Optional[str] = None
    sessionManagement: Optional[str] = None
    codeConvention: Optional[str] = None
    packageStructure: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None
    creator: str