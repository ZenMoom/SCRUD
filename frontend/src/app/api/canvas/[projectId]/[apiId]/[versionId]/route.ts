import { NextRequest, NextResponse } from "next/server"
import { CanvasApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// 쿼리 파라미터를 사용하도록 수정된 GET 함수
export async function GET(req: NextRequest) {
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

  // API 설정 구성
  const config = new Configuration({
    basePath: apiUrl,
  })

  // CanvasApi 인스턴스 생성
  const canvasApi = new CanvasApi(config)

  try {
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
