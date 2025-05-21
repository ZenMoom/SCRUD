from fastapi import APIRouter, HTTPException

from app.core.models.api_models import GenerateRequest
from app.core.services.generate_api import generate_api

api_router = APIRouter()


@api_router.post("/generate")
async def generate_api_spec_version(request: GenerateRequest):
    """
    API 스펙 버전 생성
    """
    try:
        return await generate_api(request)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
