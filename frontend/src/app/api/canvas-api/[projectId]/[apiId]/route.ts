import { NextRequest, NextResponse } from "next/server"
import { ScrudApiApi } from "@generated/api"
import { Configuration } from "@generated/configuration"
import { ApiProcessStateRequest } from "@generated/model"

// PUT 요청 핸들러 - API 처리 상태 변경
export async function PUT(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")

    // /api/canvas-api/[projectId]/[apiId] 형식의 URL에서 매개변수 추출
    const projectId = pathParts[3] // /api/canvas-api/[projectId]
    const apiId = pathParts[4] // /api/canvas-api/[projectId]/[apiId]

    if (!projectId || !apiId) {
      return NextResponse.json({ error: "프로젝트 ID와 API ID가 필요합니다." }, { status: 400 })
    }

    // API URL 가져오기
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL

    if (!apiUrl) {
      console.error("API_BASE_URL 환경 변수가 설정되지 않았습니다.")
      return NextResponse.json({ error: "API 서버 구성 오류" }, { status: 500 })
    }

    // API 클라이언트 초기화
    const config = new Configuration({
      basePath: apiUrl,
    })

    const scrudApiApi = new ScrudApiApi(config)

    // 요청 바디에서 추가 데이터 가져오기 (선택 사항)
    const requestData = await request.json().catch(() => ({}))
    console.log("요청 데이터:", requestData)

    // ApiProcessStateRequest 타입에 맞게 요청 데이터 생성
    const apiProcessStateRequest: ApiProcessStateRequest = {
      status: "USER_COMPLETED",
    }

    // API 처리 상태 변경 요청
    const response = await scrudApiApi.changeApiProcessStatus({
      projectId,
      apiId,
      apiProcessStateRequest,
    })

    return NextResponse.json(response.data)
  } catch (error) {
    const apiError = error as Error
    console.error("API 처리 상태 변경 실패:", apiError)

    return NextResponse.json({ error: "API 처리 상태 변경 중 오류가 발생했습니다: " + apiError.message }, { status: 500 })
  }
}
