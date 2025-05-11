from enum import Enum
from typing import Dict

from pydantic import BaseModel


class UserChatRequest(BaseModel):
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
    apiSpec: dict
    apiSpecUrl: str


class PositionRequest(BaseModel):
    x: float
    y: float