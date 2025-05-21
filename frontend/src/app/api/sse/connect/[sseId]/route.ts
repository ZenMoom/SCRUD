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
        const startMessage = JSON.stringify({ message: "SSE 연결이 시작되었습니다." })
        controller.enqueue(`data: ${startMessage}\n\n`)

        try {
          // API 기본 URL 설정
          const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL

          // 변경된 SSE 연결 URL
          const sseUrl = `${apiUrl}/api/v1/sse/connect/${sseId}`

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
          const decoder = new TextDecoder()
          let isCompleted = false

          // 스트림 읽기 루프
          while (!isCompleted) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            // 바이너리 데이터를 텍스트로 변환
            const chunk = decoder.decode(value, { stream: true })

            // 청크를 줄 단위로 처리
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (!line.trim()) {
                continue
              }

              // 토큰 추출 시도
              if (line.includes("[디버깅] 새 토큰 수신:")) {
                const tokenMatch = line.match(/\[디버깅\] 새 토큰 수신: (.*)/)
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1].trim()
                  const tokenPayload = JSON.stringify({ token })
                  controller.enqueue(`data: ${tokenPayload}\n\n`)
                }
              } else if (line.startsWith("data:")) {
                // SSE 형식의 데이터 라인 처리
                try {
                  // data: 접두사 제거 후 JSON 파싱
                  const sseData = line.substring(5).trim()

                  // 원본 SSE 데이터를 클라이언트에 그대로 전달
                  controller.enqueue(`${line}\n\n`)

                  // 완료 여부 확인을 위해 JSON 파싱 시도
                  try {
                    const parsedData = JSON.parse(sseData)

                    // 완료 메시지 확인
                    const isCompletionMessage =
                      parsedData.status === "COMPLETED" ||
                      (parsedData.message && parsedData.message.includes("완료")) ||
                      (parsedData.token && typeof parsedData.token === "string" && parsedData.token.includes("완료"))

                    if (isCompletionMessage) {
                      isCompleted = true
                    }
                  } catch (parseError) {
                    // JSON 파싱 실패는 무시하지만 로그는 출력
                    console.error("JSON 파싱 실패:", parseError)
                  }
                } catch (e) {
                  // SSE 데이터 파싱 오류 로그 출력
                  console.error("SSE 데이터 파싱 오류:", e)
                }
              } else {
                // 일반 텍스트 또는 JSON 처리 시도
                try {
                  // JSON 형식인지 확인
                  if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
                    try {
                      const jsonData = JSON.parse(line)
                      const jsonPayload = JSON.stringify(jsonData)
                      controller.enqueue(`data: ${jsonPayload}\n\n`)

                      // 완료 여부 확인
                      const isCompletionMessage = jsonData.status === "COMPLETED" || (jsonData.message && jsonData.message.includes("완료"))

                      if (isCompletionMessage) {
                        isCompleted = true
                      }
                    } catch (jsonError) {
                      // 파싱 실패 시 텍스트로 처리하고 로그 출력
                      console.error("JSON 형식으로 보이지만 파싱 실패:", jsonError)
                      const textPayload = JSON.stringify({ text: line })
                      controller.enqueue(`data: ${textPayload}\n\n`)
                    }
                  } else {
                    // 일반 텍스트로 처리
                    const textPayload = JSON.stringify({ text: line })
                    controller.enqueue(`data: ${textPayload}\n\n`)

                    // 완료 메시지 확인
                    const isCompletionMessage = line.includes("완료") || line.includes("COMPLETED")

                    if (isCompletionMessage) {
                      isCompleted = true
                    }
                  }
                } catch (parseError) {
                  // 파싱 오류 시 텍스트로 처리하고 로그 출력
                  console.error("파싱 오류:", parseError)
                  const textPayload = JSON.stringify({ text: line })
                  controller.enqueue(`data: ${textPayload}\n\n`)

                  // 완료 메시지 확인
                  const isCompletionMessage = line.includes("완료") || line.includes("COMPLETED")

                  if (isCompletionMessage) {
                    isCompleted = true
                  }
                }
              }
            }
          }

          // 모든 응답을 받은 후 완료 메시지 전송
          if (!isCompleted) {
            const completionMessage = JSON.stringify({ message: "응답이 완료되었습니다.", status: "COMPLETED" })
            controller.enqueue(`data: ${completionMessage}\n\n`)
          }
        } catch (error) {
          // 에러 메시지 전송
          console.error("SSE 처리 오류:", error)
          const errorMessage = JSON.stringify({
            error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
            timestamp: new Date().toISOString(),
          })

          controller.enqueue(`data: ${errorMessage}\n\n`)
        } finally {
          // 연결 종료 메시지
          const closeMessage = JSON.stringify({
            message: "SSE 연결이 종료되었습니다.",
            timestamp: new Date().toISOString(),
          })

          controller.enqueue(`data: ${closeMessage}\n\n`)

          // 스트림 종료
          controller.close()
        }
      },
      cancel() {
        // 클라이언트 연결 종료 시 처리
        console.log("SSE 스트림 취소됨 (클라이언트 연결 종료)")
      },
    })

    // 응답 반환
    return new Response(stream, { headers })
  } catch (error) {
    console.error("SSE 라우트 핸들러 오류:", error)
    return NextResponse.json(
      {
        error: "SSE 연결 처리 중 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
