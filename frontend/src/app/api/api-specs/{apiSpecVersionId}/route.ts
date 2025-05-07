import { NextResponse } from "next/server"
import { ApiSpecApi } from "@generated/api"
import { Configuration } from "@generated/configuration"
import { ApiSpecVersionUpdateRequest } from "@generated/model"

// API 스펙 상세 조회
export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
  const config = new Configuration({
    basePath: apiUrl,
  })
  const apiSpecApi = new ApiSpecApi(config)

  // API 스펙 상세 조회 요청
  // any 타입 대신 구체적인 타입 사용
  const requestParameters = {
    apiSpecVersionId: 1, // 조회할 API 스펙 버전 ID
  }

  const response = await apiSpecApi.getApiSpecById(requestParameters)
  return NextResponse.json(response.data)
}

// API 스펙 삭제
export async function DELETE() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
  const config = new Configuration({
    basePath: apiUrl,
  })
  const apiSpecApi = new ApiSpecApi(config)

  // any 타입 대신 구체적인 타입 사용
  const requestParameters = {
    apiSpecVersionId: 1, // 삭제할 API 스펙 버전 ID
  }

  // API 스펙 삭제 요청
  const response = await apiSpecApi.deleteApiSpec(requestParameters)
  return NextResponse.json(response.data)
}

// API 스펙 수정
export async function PUT() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
  const config = new Configuration({
    basePath: apiUrl,
  })
  const apiSpecApi = new ApiSpecApi(config)

  // API 스펙 수정 요청
  const apiSpecVersionUpdateRequest: ApiSpecVersionUpdateRequest = {
    endpoint: "/api/v1/examples/{id}",
    apiGroup: "example", // 필수 필드 추가
    httpMethod: "PUT", // 실제 열거형 타입으로 수정 필요
    requestBody: JSON.stringify({
      name: "홍길동",
    }),
    response: JSON.stringify({
      data: {
        id: 123,
        name: "홍길동",
      },
      message: "성공",
    }),
  }

  const requestParameters = {
    apiSpecVersionId: 1,
    apiSpecVersionUpdateRequest: apiSpecVersionUpdateRequest,
  }

  const response = await apiSpecApi.updateApiSpec(requestParameters)
  return NextResponse.json(response.data)
}
