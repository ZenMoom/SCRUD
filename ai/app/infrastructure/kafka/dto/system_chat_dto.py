from enum import Enum
from typing import Optional
from pydantic import BaseModel

# 버전 정보 모델
class VersionInfo(BaseModel):
    newVersionId: str
    description: Optional[str] = None

class PromptResponseEnum(str, Enum):
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"
    EXPLANATION = "EXPLANATION"
    MODIFIED_WITH_NEW_COMPONENTS = "MODIFIED_WITH_NEW_COMPONENTS"
    ERROR = "ERROR"

# 시스템 채팅 모델
class SystemChatResponse(BaseModel):
    systemChatId: Optional[str] = None
    status: PromptResponseEnum
    systemChatMessage: Optional[str] = None
    versionInfo: Optional[VersionInfo] = None
    diagramId: str