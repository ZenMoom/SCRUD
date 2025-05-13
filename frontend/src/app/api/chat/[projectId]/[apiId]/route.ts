import { type NextRequest, NextResponse } from "next/server"
import { ChatApi } from "@generated/api"
import { Configuration } from "@generated/configuration"

// URL에서 파라미터를 추출하는 방식
export async function GET(req: NextRequest) {
  // URL에서 직접 경로 매개변수 추출
  const url = new URL(req.url)
  const pathParts = url.pathname.split("/")

  // /api/chat 뒤에 오는 경로 파라미터 추출
  // 경로가 /api/chat/{projectId}/{apiId} 형식이라고 가정
  const projectId = pathParts[3] // /api/chat/[projectId]
  const apiId = pathParts[4] // /api/chat/[projectId]/[apiId]

  // API 기본 URL 설정
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
  // const apiUrl = "http://host.docker.internal:8000"
  // API 설정 구성
  const config = new Configuration({
    basePath: apiUrl,
  })

  // ChatApi 인스턴스 생성
  const chatApi = new ChatApi(config)

  try {
    // getPrompts API 호출 시 projectId와 apiId 전달
    const response = await chatApi.getPrompts({
      projectId,
      apiId,
    })

    // 응답 데이터를 JSON 형태로 반환
    return NextResponse.json(response.data)
  } catch (error) {
    // 에러 처리
    console.error("프롬프트 데이터 가져오기 실패:", error)
    return NextResponse.json({ error: "프롬프트 데이터를 가져오는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST 메서드 수정 - 채팅 메시지 전송
export async function POST(req: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(req.url)
    const pathParts = url.pathname.split("/")

    // /api/chat 뒤에 오는 경로 파라미터 추출
    // 경로가 /api/chat/{projectId}/{apiId} 형식이라고 가정
    const projectId = pathParts[3] // /api/chat/[projectId]
    const apiId = pathParts[4] // /api/chat/[projectId]/[apiId]

    // 요청 바디 파싱
    const requestBody = await req.json()

    // API 기본 URL 설정 - 하드코딩된 URL 사용
    // const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
    const apiUrl = "http://host.docker.internal:8000"

    console.log("API 요청 정보:", {
      url: `${apiUrl}/api/chat/prompt`,
      projectId,
      apiId,
      body: requestBody,
    })

    // API 설정 구성
    const config = new Configuration({
      basePath: apiUrl,
    })

    // ChatApi 인스턴스 생성
    const chatApi = new ChatApi(config)

    // promptChat API 호출
    const response = await chatApi.promptChat({
      projectId,
      apiId,
      userChatRequest: requestBody,
    })

    console.log("채팅 API 응답:", response.data)

    // 응답 데이터를 JSON 형태로 반환
    return NextResponse.json(response.data)
  } catch (error) {
    // 에러 처리
    console.error("채팅 메시지 전송 실패:", error)

    // 좀 더 자세한 에러 정보 제공
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "채팅 메시지 전송 중 오류가 발생했습니다.",
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "채팅 메시지 전송 중 오류가 발생했습니다." }, { status: 500 })
  }
}
