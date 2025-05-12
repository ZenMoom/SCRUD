import { NextRequest, NextResponse } from "next/server"
import { ScrudApiApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// GET 요청 핸들러 - 미완성 API 목록 조회
export async function GET(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")

    // /api/canvas-api/[projectId] 형식의 URL에서 매개변수 추출
    const projectId = pathParts[3] // /api/canvas-api/[projectId]

    if (!projectId) {
      return NextResponse.json({ error: "프로젝트 ID가 필요합니다." }, { status: 400 })
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

    // exclude 값을 쿼리로 설정
    const excludeValues = "USER_COMPLETED,AI_GENERATED"

    // 미완성 API 목록 조회 요청
    const response = await scrudApiApi.getIncompleteApis({
      projectId,
      exclude: excludeValues,
    })

    return NextResponse.json(response.data)
  } catch (error) {
    const apiError = error as Error
    console.error("미완성 API 목록 조회 실패:", apiError)

    return NextResponse.json({ error: "미완성 API 목록을 불러오는 중 오류가 발생했습니다: " + apiError.message }, { status: 500 })
  }
}
