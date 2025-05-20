import { type NextRequest, NextResponse } from "next/server"
import { CanvasApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// 다이어그램 생성을 위한 POST 함수
export async function POST(req: NextRequest) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authToken = req.headers.get("Authorization")

    // URL에서 직접 경로 매개변수 추출
    const url = new URL(req.url)
    const pathParts = url.pathname.split("/")

    // /api/canvas/[projectId]/[apiId] 형식의 URL에서 매개변수 추출
    const projectId = pathParts[3] // /api/canvas/[projectId]
    const apiId = pathParts[4] // /api/canvas/[projectId]/[apiId]

    // 필수 매개변수 검증
    if (!projectId || !apiId) {
      return NextResponse.json({ error: "프로젝트 ID와 API ID가 필요합니다." }, { status: 400 })
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    // const apiUrl = "http://host.docker.internal:8000"

    // API 설정 구성 - 인증 토큰이 있는 경우 헤더에 추가
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : undefined,
      },
    })

    // CanvasApi 인스턴스 생성
    const canvasApi = new CanvasApi(config)

    // createDiagram API 호출
    const response = await canvasApi.createDiagram({
      projectId,
      apiId,
    })

    // 응답 데이터를 JSON 형태로 반환
    return NextResponse.json(response.data)
  } catch (error) {
    // 에러 처리
    console.error("다이어그램 생성 실패:", error)

    // 에러 객체에서 메시지 추출
    const errorMessage = error instanceof Error ? error.message : "다이어그램을 생성하는 중 알 수 없는 오류가 발생했습니다."

    return NextResponse.json({ error: "다이어그램 생성 중 오류가 발생했습니다: " + errorMessage }, { status: 500 })
  }
}

// 쿼리 파라미터를 사용하도록 수정된 GET 함수
export async function GET(req: NextRequest) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authToken = req.headers.get("Authorization")

    // URL에서 직접 경로 매개변수 추출
    const url = new URL(req.url)
    const pathParts = url.pathname.split("/")

    // /api/canvas/[projectId]/[apiId] 형식의 URL에서 매개변수 추출
    const projectId = pathParts[3] // /api/canvas/[projectId]
    const apiId = pathParts[4] // /api/canvas/[projectId]/[apiId]

    // 쿼리 파라미터에서 버전 ID 추출
    const searchParams = url.searchParams
    let versionId = searchParams.get("version")

    // 이전 URL 형식 지원: 쿼리 파라미터가 없으면 경로에서 찾기
    if (!versionId && pathParts.length > 5) {
      versionId = pathParts[5] // 이전 방식의 URL 지원
    }

    // 버전 ID가 없는 경우 오류 응답
    if (!versionId) {
      return NextResponse.json({ error: "버전 ID가 제공되지 않았습니다. 'version' 쿼리 파라미터를 추가하거나 경로에 포함하세요." }, { status: 400 })
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    // const apiUrl = "http://host.docker.internal:8000"

    // API 설정 구성 - 인증 토큰이 있는 경우 헤더에 추가
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: authToken
          ? {
              Authorization: authToken,
            }
          : undefined,
      },
    })

    // CanvasApi 인스턴스 생성
    const canvasApi = new CanvasApi(config)

    // getDiagram API 호출 시 파라미터로 경로 ID들 전달
    const response = await canvasApi.getDiagram({
      projectId,
      apiId,
      versionId,
    })

    // 응답 데이터를 JSON 형태로 반환
    return NextResponse.json(response.data)
  } catch (error) {
    // 에러 처리
    console.error("다이어그램 데이터 가져오기 실패:", error)
    return NextResponse.json({ error: "다이어그램 데이터를 가져오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
