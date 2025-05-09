from enum import Enum
from typing import List
from pydantic import BaseModel


class MethodPromptTarget(str, Enum):
    SIGNATURE = "SIGNATURE"
    BODY = "BODY"

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

class TargetMethod(BaseModel):
    methodId: str
    componentId: str

# 사용자 채팅 모델
class UserChatRequest(BaseModel):
    tag: MethodPromptTag
    promptType: MethodPromptTarget
    message: str
    targetMethods: List[TargetMethod]