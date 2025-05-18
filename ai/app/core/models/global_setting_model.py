from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict


class GlobalFileListChainPayload(BaseModel):
    class GlobalFileChainPayload(BaseModel):
        globalFileId: int = Field(..., description="글로벌 파일의 고유 식별자")
        fileName: Optional[str] = Field(None, description="파일의 이름")
        fileType: Optional[str] = Field(None, description="파일의 유형")
        fileUrl: Optional[str] = Field(None, description="파일의 URL 경로")
        fileContent: Optional[str] = Field(None, description="파일의 내용")

        model_config = ConfigDict(
            from_attributes=True,
            json_schema_extra={
                "example": {
                    "globalFileId": 1,
                    "fileName": "example.txt",
                    "fileType": "text",
                    "fileUrl": "https://example.com/files/example.txt",
                    "fileContent": "파일 내용 예시"
                }
            }
        )

    class ScrudProjectChainPayload(BaseModel):
        scrudProjectId: Optional[int] = Field(None, description="SCRUD 프로젝트의 고유 식별자")
        title: Optional[str] = Field(None, description="프로젝트 제목")
        description: Optional[str] = Field(None, description="프로젝트에 대한 설명")
        serverUrl: Optional[str] = Field(None, description="서버 URL 주소")
        updatedAt: Optional[str] = Field(None, description="마지막 업데이트 날짜 및 시간")

        model_config = ConfigDict(
            from_attributes=True,
            json_schema_extra={
                "example": {
                    "scrudProjectId": 1,
                    "title": "예시 프로젝트",
                    "description": "이 프로젝트는 예시입니다",
                    "serverUrl": "https://api.example.com",
                    "updatedAt": "2023-07-25T14:30:00Z"
                }
            }
        )

    project: Optional[ScrudProjectChainPayload] = Field([], description="프로젝트 정보")
    content: Optional[List[GlobalFileChainPayload]] = Field([], description="글로벌 파일 목록")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "project": {
                    "scrudProjectId": 1,
                    "title": "예시 프로젝트",
                    "description": "이 프로젝트는 예시입니다",
                    "serverUrl": "https://api.example.com",
                    "updatedAt": "2023-07-25T14:30:00Z"
                },
                "content": [
                    {
                        "globalFileId": 1,
                        "fileName": "example.txt",
                        "fileType": "text",
                        "fileUrl": "https://example.com/files/example.txt",
                        "fileContent": "파일 내용 예시"
                    }
                ]
            }
        }
    )


class ApiSpecChainPayload(BaseModel):
    summary: Optional[str] = Field(None, description="API의 요약 정보")
    pathParameters: Optional[str] = Field(None, description="API의 경로 매개변수")
    endpoint: Optional[str] = Field(None, description="API 엔드포인트 주소")
    apiGroup: Optional[str] = Field(None, description="API 그룹 분류")
    queryParameters: Optional[str] = Field(None, description="API의 쿼리 매개변수")
    requestBody: Optional[str] = Field(None, description="API 요청 본문")
    response: Optional[str] = Field(None, description="API 응답 데이터")
    description: Optional[str] = Field(None, description="API에 대한 상세 설명")
    httpMethod: Optional[str] = Field(None, description="HTTP 메서드(GET, POST 등)")
    apiSpecVersionId: Optional[int] = Field(None, description="API 명세 버전 ID")
    version: Optional[int] = Field(None, description="API 버전")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "summary": "사용자 목록 조회",
                "pathParameters": "None",
                "endpoint": "/api/users",
                "apiGroup": "사용자 관리",
                "queryParameters": "page=1&size=10",
                "requestBody": "None",
                "response": "{ users: [{ id: 1, name: '홍길동' }] }",
                "description": "모든 사용자 목록을 페이징 처리하여 조회합니다",
                "httpMethod": "GET",
                "apiSpecVersionId": 1,
                "version": 1
            }
        }
    )
