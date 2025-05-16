from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, Field
from app.config.config import settings

class GlobalFile(BaseModel):
    globalFileId: int
    fileName: Optional[str] = None
    fileType: Optional[str] = None
    fileUrl: Optional[str] = None
    fileContent: Optional[str] = None


class GlobalFileList(BaseModel):
    class ScrudProject(BaseModel):
        scrudProjectId: Optional[int] = None
        title: Optional[str] = None
        description: Optional[str] = None
        serverUrl: Optional[str] = None
        updatedAt: Optional[str] = None

    project: Optional[ScrudProject] = []
    content: Optional[List[GlobalFile]] = []

class ApiSpec(BaseModel):
    summary: Optional[str] = None
    pathParameters: Optional[str] = None
    endpoint: Optional[str] = None
    apiGroup: Optional[str] = None
    queryParameters: Optional[str] = None
    requestBody: Optional[str] = None
    response: Optional[str] = None
    description: Optional[str] = None
    httpMethod: Optional[str] = None
    apiSpecVersionId: Optional[str] = None
    version: Optional[str] = None

class ApiClient:
    """
    Client for interacting with the external API that requires authentication.
    Uses httpx for making HTTP requests.
    """

    def __init__(self, base_url: str = "http://localhost:8080"):
        """
        Initialize the API client.

        Args:
            base_url: Base URL for the API, defaults to localhost:8080
        """
        self.base_url = base_url if base_url is not None else settings.A_HTTP_SPRING_BASE_URL
        self.client = httpx.AsyncClient(base_url=base_url, timeout=30.0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_project(self, project_id: str, token: str) -> GlobalFileList:
        """
        Get a specific project by ID using an authentication token.

        Args:
            project_id: ID of the project to retrieve
            token: JWT bearer token for authentication

        Returns:
            ScrudProject object

        Raises:
            httpx.HTTPStatusError: If the request fails
        """
        headers = {
            "Authorization": f"{token}"
        }

        response = await self.client.get(f"/api/v1/projects/{project_id}", headers=headers)
        print(f"get_projects: {response.json()}")
        response.raise_for_status()

        return GlobalFileList.model_validate(response.json())

    async def get_api_spec(self, api_spec_id: str, token: str) -> ApiSpec:
        response = await self.client.get(f"/api/v1/api-specs/{api_spec_id}")
        return ApiSpec.model_validate(response.json())