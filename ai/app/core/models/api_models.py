from typing import Optional

from pydantic import BaseModel
from pydantic import RootModel


# api model
class ApiModel(BaseModel):
    summary: str
    endpoint: str
    response: str
    description: str
    httpMethod: str
    requestBody: Optional[str] = None
    queryParameters: Optional[str] = None
    pathParameters: Optional[str] = None


class ApiModelList(RootModel[list[ApiModel]]):
    pass


# generate request
class GenerateRequest(BaseModel):
    requirements: str
    erd: str
    extra_info: Optional[str] = ""


# generate response
class GenerateResponse(BaseModel):
    success: bool
    prompt: str
    result: list[ApiModel]
