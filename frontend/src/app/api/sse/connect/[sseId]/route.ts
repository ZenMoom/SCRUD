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
          // API 기본 URL 설정 - 하드코딩된 URL 사용
          const apiUrl = "http://host.docker.internal:8000"

          // 변경된 SSE 연결 URL
          const sseUrl = `${apiUrl}/api/v1/sse/connect/${sseId}`

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
          const decoder = new TextDecoder()
          let isCompleted = false

          // 스트림 읽기 루프
          while (!isCompleted) {
            const { done, value } = await reader.read()

            if (done) {
              console.log("SSE 스트림 종료 (done 신호 수신)")
              break
            }

            // 바이너리 데이터를 텍스트로 변환
            const chunk = decoder.decode(value, { stream: true })
            console.log("수신된 청크:", chunk)

            // 청크를 줄 단위로 처리
            const lines = chunk.split("\n")
            for (const line of lines) {
              if (!line.trim()) continue

              // 토큰 추출 시도
              if (line.includes("[디버깅] 새 토큰 수신:")) {
                const tokenMatch = line.match(/\[디버깅\] 새 토큰 수신: (.*)/)
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1].trim()
                  console.log("토큰 추출:", token)
                  controller.enqueue(`data: ${JSON.stringify({ token })}\n\n`)
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
                    if (parsedData.status === "COMPLETED" || (parsedData.message && parsedData.message.includes("완료")) || (parsedData.token && parsedData.token.includes("완료"))) {
                      console.log("완료 메시지 감지 (SSE 데이터 내부)")
                      isCompleted = true
                    }
                  } catch (parseError) {
                    // JSON 파싱 실패는 무시
                  }
                } catch (e) {
                  console.error("SSE 데이터 파싱 오류:", e)
                }
              } else {
                // 일반 텍스트 또는 JSON 처리 시도
                try {
                  // JSON 형식인지 확인
                  if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
                    const jsonData = JSON.parse(line)
                    controller.enqueue(`data: ${JSON.stringify(jsonData)}\n\n`)

                    // 완료 여부 확인
                    if (jsonData.status === "COMPLETED" || (jsonData.message && jsonData.message.includes("완료"))) {
                      console.log("완료 메시지 감지 (JSON 데이터)")
                      isCompleted = true
                    }
                  } else {
                    // 일반 텍스트로 처리
                    controller.enqueue(`data: ${JSON.stringify({ text: line })}\n\n`)

                    // 완료 메시지 확인
                    if (line.includes("완료") || line.includes("COMPLETED")) {
                      console.log("완료 메시지 감지 (일반 텍스트)")
                      isCompleted = true
                    }
                  }
                } catch (parseError) {
                  // 파싱 오류 시 텍스트로 처리
                  controller.enqueue(`data: ${JSON.stringify({ text: line })}\n\n`)

                  // 완료 메시지 확인
                  if (line.includes("완료") || line.includes("COMPLETED")) {
                    console.log("완료 메시지 감지 (파싱 오류 후)")
                    isCompleted = true
                  }
                }
              }
            }
          }

          // 모든 응답을 받은 후 완료 메시지 전송
          if (!isCompleted) {
            console.log("스트림 종료 감지, 완료 메시지 전송")
            controller.enqueue(`data: ${JSON.stringify({ message: "응답이 완료되었습니다.", status: "COMPLETED" })}\n\n`)
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
