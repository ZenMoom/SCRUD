import { NextResponse } from "next/server"
import { ApiSpecApi } from "@generated/api"
import { Configuration } from "@generated/configuration"
import { ApiSpecVersionCreateRequest, ApiSpecVersionCreateRequestHttpMethodEnum } from "@generated/model"

// API 스펙 생성하기
export async function POST() {
  try {
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const config = new Configuration({
      basePath: apiUrl,
    })
    const apiSpecApi = new ApiSpecApi(config)

    const httpMethod = "POST" as ApiSpecVersionCreateRequestHttpMethodEnum

    // 기본 필수 필드
    const apiSpecData = {
      endpoint: "/api/v1/examples/{id}",
      apiGroup: "example",
      httpMethod: httpMethod,
      scrudProjectId: 1,
      description: "API 설명",
      summary: "API 요약",
    }

    // HTTP 메소드에 따라 필요한 필드 추가
    if (apiSpecData.httpMethod === "POST" || apiSpecData.httpMethod === "PUT") {
      Object.assign(apiSpecData, {
        requestBody: JSON.stringify({
          name: "홍길동",
        }),
      })
    }

    if (apiSpecData.httpMethod === "GET") {
      Object.assign(apiSpecData, {
        queryParameters: JSON.stringify({
          page: "1",
          size: "10",
        }),
      })
    }

    // 경로 매개변수가 있는 경우
    if (apiSpecData.endpoint.includes("{")) {
      Object.assign(apiSpecData, {
        pathParameters: JSON.stringify({
          id: "123",
        }),
      })
    }

    // 응답 정보 추가
    Object.assign(apiSpecData, {
      response: JSON.stringify({
        data: {
          id: 123,
          name: "홍길동",
        },
        message: "성공",
      }),
    })

    // API 스펙 생성 요청
    const response = await apiSpecApi.createApiSpec({
      apiSpecVersionCreateRequest: apiSpecData as ApiSpecVersionCreateRequest,
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("API 스펙 생성 오류:", error)
    return NextResponse.json({ error: "API 스펙 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
