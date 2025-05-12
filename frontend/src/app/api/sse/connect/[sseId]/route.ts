import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")

    // /api/sse/connect/[sseId] 형식의 URL에서 매개변수 추출
    const sseId = pathParts[4] // 인덱스는 URL 구조에 따라 조정

    if (!sseId || sseId.trim() === "") {
      return NextResponse.json({ error: "유효하지 않은 SSE ID입니다." }, { status: 400 })
    }

    // 응답 헤더 설정 - CORS 헤더 추가
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    })

    // 스트림 생성
    const stream = new ReadableStream({
      async start(controller) {
        // 연결 시작 메시지
        controller.enqueue(`data: ${JSON.stringify({ message: "SSE 연결이 시작되었습니다." })}\n\n`)

        try {
          // API 기본 URL 설정
          const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL || ""

          // SSE 연결 URL
          const sseUrl = `${apiUrl}/api/sse/connect/${sseId}`

          console.log(`SSE 연결 시도: ${sseUrl}`)

          // 서버에 SSE 연결 요청
          const response = await fetch(sseUrl, {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
            },
          })

          if (!response.ok) {
            throw new Error(`SSE 연결 실패: ${response.status} ${response.statusText}`)
          }

          if (!response.body) {
            throw new Error("응답 본문이 없습니다.")
          }

          // 응답 스트림 처리
          const reader = response.body.getReader()

          // 텍스트 디코더 생성
          const decoder = new TextDecoder()
          let buffer = "" // 불완전한 청크를 저장하기 위한 버퍼

          // 스트림 읽기 루프
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              console.log("SSE 스트림 종료")
              break
            }

            // 바이너리 데이터를 텍스트로 변환
            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 완전한 메시지 찾기 (이벤트 구분자로 분리)
            const messages = buffer.split("\n\n")
            buffer = messages.pop() || "" // 마지막 불완전한 메시지는 버퍼에 유지

            // 완전한 메시지 처리
            for (const message of messages) {
              if (message.trim()) {
                console.log("SSE 메시지 처리:", message)
                controller.enqueue(`data: ${message}\n\n`)
              }
            }
          }

          // 남은 버퍼 처리
          if (buffer.trim()) {
            console.log("남은 버퍼 처리:", buffer)
            controller.enqueue(`data: ${buffer}\n\n`)
          }
        } catch (error) {
          console.error("SSE 처리 오류:", error)

          // 에러 메시지 전송
          controller.enqueue(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
            })}\n\n`
          )
        } finally {
          // 연결 종료 메시지
          controller.enqueue(`data: ${JSON.stringify({ message: "SSE 연결이 종료되었습니다." })}\n\n`)

          // 스트림 종료
          controller.close()
          console.log("SSE 스트림 컨트롤러 종료")
        }
      },
    })

    // 응답 반환
    return new Response(stream, { headers })
  } catch (error) {
    console.error("SSE 라우트 핸들러 오류:", error)
    return NextResponse.json({ error: "SSE 연결 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
