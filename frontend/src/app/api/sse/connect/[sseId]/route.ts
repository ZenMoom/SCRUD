import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Define more specific types for logging functions
type LoggableData = unknown

// 디버깅 유틸리티 함수
function logWithTimestamp(message: string, data?: LoggableData) {
  const timestamp = new Date().toISOString()
  if (data) {
    console.log(`[${timestamp}] 🔍 ${message}:`, data)
  } else {
    console.log(`[${timestamp}] 🔍 ${message}`)
  }
}

function logError(message: string, error: Error | unknown) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ❌ ${message}:`, error)
  if (error instanceof Error) {
    console.error(`[${timestamp}] ❌ 에러 메시지: ${error.message}`)
    console.error(`[${timestamp}] ❌ 에러 스택: ${error.stack}`)
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logWithTimestamp(`SSE 라우트 핸들러 시작`)

  try {
    // 요청 정보 로깅
    logWithTimestamp(`요청 URL`, request.url)
    logWithTimestamp(`요청 메서드`, request.method)
    logWithTimestamp(`요청 헤더`, Object.fromEntries([...request.headers.entries()]))

    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    logWithTimestamp(`URL 경로 파싱`, pathParts)

    // /api/sse/connect/[sseId] 형식의 URL에서 매개변수 추출
    const sseId = pathParts[4] // 인덱스는 URL 구조에 따라 조정
    logWithTimestamp(`추출된 SSE ID`, sseId)

    if (!sseId || sseId.trim() === "") {
      logWithTimestamp(`유효하지 않은 SSE ID`)
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

    logWithTimestamp(`응답 헤더 설정`, Object.fromEntries([...headers.entries()]))

    // 스트림 생성
    const stream = new ReadableStream({
      async start(controller) {
        logWithTimestamp(`스트림 컨트롤러 시작`)

        // 연결 시작 메시지
        const startMessage = JSON.stringify({ message: "SSE 연결이 시작되었습니다." })
        logWithTimestamp(`연결 시작 메시지 전송`, startMessage)
        controller.enqueue(`data: ${startMessage}\n\n`)

        try {
          // API 기본 URL 설정
          const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL
          logWithTimestamp(`백엔드 API URL`, apiUrl)

          // 변경된 SSE 연결 URL
          const sseUrl = `${apiUrl}/api/v1/sse/connect/${sseId}`
          logWithTimestamp(`SSE 연결 URL`, sseUrl)

          // 서버에 SSE 연결 요청
          logWithTimestamp(`백엔드 SSE 연결 요청 시작`)
          const fetchStartTime = Date.now()

          const response = await fetch(sseUrl, {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
            },
          })

          const fetchEndTime = Date.now()
          logWithTimestamp(`백엔드 SSE 연결 응답 수신 (${fetchEndTime - fetchStartTime}ms)`)
          logWithTimestamp(`응답 상태`, `${response.status} ${response.statusText}`)
          logWithTimestamp(`응답 헤더`, Object.fromEntries([...response.headers.entries()]))

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
          let chunkCount = 0
          let totalBytes = 0
          let lineCount = 0

          logWithTimestamp(`스트림 읽기 루프 시작`)

          // 스트림 읽기 루프
          while (!isCompleted) {
            const { done, value } = await reader.read()

            if (done) {
              logWithTimestamp(`스트림 읽기 완료 (done 신호 수신)`)
              break
            }

            chunkCount++
            totalBytes += value?.length || 0

            // 바이너리 데이터를 텍스트로 변환
            const chunk = decoder.decode(value, { stream: true })
            logWithTimestamp(`청크 #${chunkCount} 수신 (${value.length} 바이트)`, chunk)

            // 청크를 줄 단위로 처리
            const lines = chunk.split("\n")
            logWithTimestamp(`청크에서 ${lines.length}개 라인 발견`)

            for (const line of lines) {
              lineCount++

              if (!line.trim()) {
                logWithTimestamp(`라인 #${lineCount}: 빈 라인 무시`)
                continue
              }

              logWithTimestamp(`라인 #${lineCount} 처리`, line)

              // 토큰 추출 시도
              if (line.includes("[디버깅] 새 토큰 수신:")) {
                logWithTimestamp(`라인 #${lineCount}: 디버깅 토큰 패턴 감지`)

                const tokenMatch = line.match(/\[디버깅\] 새 토큰 수신: (.*)/)
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1].trim()
                  logWithTimestamp(`라인 #${lineCount}: 토큰 추출 성공`, token)

                  const tokenPayload = JSON.stringify({ token })
                  logWithTimestamp(`라인 #${lineCount}: 클라이언트에 토큰 전송`, tokenPayload)
                  controller.enqueue(`data: ${tokenPayload}\n\n`)
                } else {
                  logWithTimestamp(`라인 #${lineCount}: 토큰 추출 실패`)
                }
              } else if (line.startsWith("data:")) {
                // SSE 형식의 데이터 라인 처리
                logWithTimestamp(`라인 #${lineCount}: SSE 데이터 라인 감지`)

                try {
                  // data: 접두사 제거 후 JSON 파싱
                  const sseData = line.substring(5).trim()
                  logWithTimestamp(`라인 #${lineCount}: data: 접두사 제거 후`, sseData)

                  // 원본 SSE 데이터를 클라이언트에 그대로 전달
                  logWithTimestamp(`라인 #${lineCount}: 클라이언트에 원본 SSE 데이터 전달`, line)
                  controller.enqueue(`${line}\n\n`)

                  // 완료 여부 확인을 위해 JSON 파싱 시도
                  try {
                    const parsedData = JSON.parse(sseData)
                    logWithTimestamp(`라인 #${lineCount}: JSON 파싱 성공`, parsedData)

                    // 완료 메시지 확인
                    const isCompletionMessage =
                      parsedData.status === "COMPLETED" ||
                      (parsedData.message && parsedData.message.includes("완료")) ||
                      (parsedData.token && typeof parsedData.token === "string" && parsedData.token.includes("완료"))

                    logWithTimestamp(`라인 #${lineCount}: 완료 메시지 여부`, isCompletionMessage)

                    if (isCompletionMessage) {
                      logWithTimestamp(`라인 #${lineCount}: 완료 메시지 감지 (SSE 데이터 내부)`)
                      isCompleted = true
                    }
                  } catch (parseError) {
                    logWithTimestamp(`라인 #${lineCount}: JSON 파싱 실패`, parseError)
                    // JSON 파싱 실패는 무시
                  }
                } catch (e) {
                  logError(`라인 #${lineCount}: SSE 데이터 파싱 오류`, e)
                }
              } else {
                // 일반 텍스트 또는 JSON 처리 시도
                logWithTimestamp(`라인 #${lineCount}: 일반 텍스트/JSON 처리 시도`)

                try {
                  // JSON 형식인지 확인
                  if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
                    logWithTimestamp(`라인 #${lineCount}: JSON 형식 감지`)

                    try {
                      const jsonData = JSON.parse(line)
                      logWithTimestamp(`라인 #${lineCount}: JSON 파싱 성공`, jsonData)

                      const jsonPayload = JSON.stringify(jsonData)
                      logWithTimestamp(`라인 #${lineCount}: 클라이언트에 JSON 전달`, jsonPayload)
                      controller.enqueue(`data: ${jsonPayload}\n\n`)

                      // 완료 여부 확인
                      const isCompletionMessage = jsonData.status === "COMPLETED" || (jsonData.message && jsonData.message.includes("완료"))

                      logWithTimestamp(`라인 #${lineCount}: 완료 메시지 여부`, isCompletionMessage)

                      if (isCompletionMessage) {
                        logWithTimestamp(`라인 #${lineCount}: 완료 메시지 감지 (JSON 데이터)`)
                        isCompleted = true
                      }
                    } catch (jsonError) {
                      logWithTimestamp(`라인 #${lineCount}: JSON 형식으로 보이지만 파싱 실패`, jsonError)

                      // 파싱 실패 시 텍스트로 처리
                      const textPayload = JSON.stringify({ text: line })
                      logWithTimestamp(`라인 #${lineCount}: 텍스트로 대체 처리`, textPayload)
                      controller.enqueue(`data: ${textPayload}\n\n`)
                    }
                  } else {
                    // 일반 텍스트로 처리
                    logWithTimestamp(`라인 #${lineCount}: 일반 텍스트로 처리`)

                    const textPayload = JSON.stringify({ text: line })
                    logWithTimestamp(`라인 #${lineCount}: 클라이언트에 텍스트 전달`, textPayload)
                    controller.enqueue(`data: ${textPayload}\n\n`)

                    // 완료 메시지 확인
                    const isCompletionMessage = line.includes("완료") || line.includes("COMPLETED")
                    logWithTimestamp(`라인 #${lineCount}: 완료 메시지 여부`, isCompletionMessage)

                    if (isCompletionMessage) {
                      logWithTimestamp(`라인 #${lineCount}: 완료 메시지 감지 (일반 텍스트)`)
                      isCompleted = true
                    }
                  }
                } catch (parseError) {
                  logError(`라인 #${lineCount}: 파싱 오류`, parseError)

                  // 파싱 오류 시 텍스트로 처리
                  const textPayload = JSON.stringify({ text: line })
                  logWithTimestamp(`라인 #${lineCount}: 파싱 오류 후 텍스트 전달`, textPayload)
                  controller.enqueue(`data: ${textPayload}\n\n`)

                  // 완료 메시지 확인
                  const isCompletionMessage = line.includes("완료") || line.includes("COMPLETED")
                  logWithTimestamp(`라인 #${lineCount}: 완료 메시지 여부`, isCompletionMessage)

                  if (isCompletionMessage) {
                    logWithTimestamp(`라인 #${lineCount}: 완료 메시지 감지 (파싱 오류 후)`)
                    isCompleted = true
                  }
                }
              }
            }
          }

          // 스트림 처리 통계
          logWithTimestamp(`스트림 처리 통계`, {
            총청크수: chunkCount,
            총바이트: totalBytes,
            총라인수: lineCount,
            처리시간: `${Date.now() - startTime}ms`,
          })

          // 모든 응답을 받은 후 완료 메시지 전송
          if (!isCompleted) {
            logWithTimestamp(`스트림 종료 감지, 완료 메시지 전송`)
            const completionMessage = JSON.stringify({ message: "응답이 완료되었습니다.", status: "COMPLETED" })
            controller.enqueue(`data: ${completionMessage}\n\n`)
          }
        } catch (error) {
          logError(`SSE 처리 오류`, error)

          // 에러 메시지 전송
          const errorMessage = JSON.stringify({
            error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
            timestamp: new Date().toISOString(),
          })

          logWithTimestamp(`클라이언트에 에러 메시지 전송`, errorMessage)
          controller.enqueue(`data: ${errorMessage}\n\n`)
        } finally {
          // 연결 종료 메시지
          const closeMessage = JSON.stringify({
            message: "SSE 연결이 종료되었습니다.",
            timestamp: new Date().toISOString(),
            totalProcessingTime: `${Date.now() - startTime}ms`,
          })

          logWithTimestamp(`연결 종료 메시지 전송`, closeMessage)
          controller.enqueue(`data: ${closeMessage}\n\n`)

          // 스트림 종료
          controller.close()
          logWithTimestamp(`SSE 스트림 컨트롤러 종료 (총 처리 시간: ${Date.now() - startTime}ms)`)
        }
      },
      cancel() {
        logWithTimestamp(`SSE 스트림 취소됨 (클라이언트 연결 종료)`)
      },
    })

    // 응답 반환
    logWithTimestamp(`SSE 스트림 응답 반환`)
    return new Response(stream, { headers })
  } catch (error) {
    logError(`SSE 라우트 핸들러 오류`, error)
    return NextResponse.json(
      {
        error: "SSE 연결 처리 중 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  } finally {
    logWithTimestamp(`SSE 라우트 핸들러 종료 (총 처리 시간: ${Date.now() - startTime}ms)`)
  }
}
