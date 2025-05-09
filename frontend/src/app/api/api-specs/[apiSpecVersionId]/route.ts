import { NextRequest, NextResponse } from "next/server"
import { ApiSpecApi } from "@generated/api"
import { Configuration } from "@generated/configuration"
import { ApiSpecVersionUpdateRequest } from "@generated/model"

// API 스펙 상세 조회
export async function GET(request: NextRequest, context: { params: { apiSpecVersionId: string } }) {
  try {
    const apiSpecVersionId = Number(context.params.apiSpecVersionId)

    if (isNaN(apiSpecVersionId)) {
      return NextResponse.json({ error: "유효하지 않은 API 스펙 ID입니다." }, { status: 400 })
    }

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const config = new Configuration({
      basePath: apiUrl,
    })
    const apiSpecApi = new ApiSpecApi(config)

    // API 스펙 상세 조회 요청
    const requestParameters = {
      apiSpecVersionId,
    }

    const response = await apiSpecApi.getApiSpecById(requestParameters)
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error("API 스펙 조회 오류:", error)

    const errorMessage = error instanceof Error ? error.message : "API 스펙 조회 중 오류가 발생했습니다."

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// API 스펙 수정
export async function PUT(request: NextRequest, context: { params: { apiSpecVersionId: string } }) {
  try {
    const apiSpecVersionId = Number(context.params.apiSpecVersionId)

    if (isNaN(apiSpecVersionId)) {
      return NextResponse.json({ error: "유효하지 않은 API 스펙 ID입니다." }, { status: 400 })
    }

    const body = await request.json()

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const config = new Configuration({
      basePath: apiUrl,
    })
    const apiSpecApi = new ApiSpecApi(config)

    // API 스펙 수정 요청
    const apiSpecVersionUpdateRequest: ApiSpecVersionUpdateRequest = {
      endpoint: body.endpoint,
      httpMethod: body.httpMethod,
      description: body.description || "",
      summary: body.summary || "",
    }

    // 선택적 필드 추가
    if (body.requestBody) {
      apiSpecVersionUpdateRequest.requestBody = body.requestBody
    }

    if (body.pathParameters) {
      apiSpecVersionUpdateRequest.pathParameters = body.pathParameters
    }

    if (body.queryParameters) {
      apiSpecVersionUpdateRequest.queryParameters = body.queryParameters
    }

    if (body.response) {
      apiSpecVersionUpdateRequest.response = body.response
    }

    const requestParameters = {
      apiSpecVersionId,
      apiSpecVersionUpdateRequest,
    }

    const response = await apiSpecApi.updateApiSpec(requestParameters)
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error("API 스펙 수정 오류:", error)

    const errorMessage = error instanceof Error ? error.message : "API 스펙 수정 중 오류가 발생했습니다."

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// API 스펙 삭제
export async function DELETE(request: NextRequest, context: { params: { apiSpecVersionId: string } }) {
  try {
    const apiSpecVersionId = Number(context.params.apiSpecVersionId)

    if (isNaN(apiSpecVersionId)) {
      return NextResponse.json({ error: "유효하지 않은 API 스펙 ID입니다." }, { status: 400 })
    }

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const config = new Configuration({
      basePath: apiUrl,
    })
    const apiSpecApi = new ApiSpecApi(config)

    // API 스펙 삭제 요청
    const requestParameters = {
      apiSpecVersionId,
    }

    const response = await apiSpecApi.deleteApiSpec(requestParameters)
    return NextResponse.json(response.data)
  } catch (error: unknown) {
    console.error("API 스펙 삭제 오류:", error)

    const errorMessage = error instanceof Error ? error.message : "API 스펙 삭제 중 오류가 발생했습니다."

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
