"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import axios from "axios"
import { Send, RefreshCw, X, AlertCircle } from "lucide-react"
import type { ChatHistoryResponse, SSEIdResponse } from "@generated/model"
import type { TargetNode } from "./DiagramContainer"

type ChatContainerProps = {
  projectId: string
  apiId: string
  versionId: string
  chatData: ChatHistoryResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
  targetNodes: TargetNode[]
  onRemoveTarget: (nodeId: string) => void
}

// SSE 응답 타입 정의
interface SSEResponse {
  token?: string
  chunk?: string
  message?: string
  status?: string
  versionInfo?: {
    newVersionId: string
    description: string
  }
  error?: string
  text?: string
  done?: boolean
}

export default function ChatContainer({ projectId, apiId, versionId, chatData, loading, error, onRefresh, targetNodes, onRemoveTarget }: ChatContainerProps) {
  const [systemResponse, setSystemResponse] = useState<SSEIdResponse | null>(null)
  const [message, setMessage] = useState<string>("")
  const [lastSentMessage, setLastSentMessage] = useState<string>("")
  const [sending, setSending] = useState<boolean>(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // SSE 관련 상태 추가
  const [sseConnected, setSSEConnected] = useState<boolean>(false)
  const [currentSSEId, setCurrentSSEId] = useState<string | null>(null)
  const [sseError, setSSEError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // 누적 토큰을 위한 상태 추가
  const [accumulatedText, setAccumulatedText] = useState<string>("")

  // 디버그 모드 상태 추가
  const [debugMode, setDebugMode] = useState<boolean>(true) // 기본값을 true로 설정
  const [debugMessages, setDebugMessages] = useState<string[]>([])

  // 연결 시도 중인지 추적하는 상태
  const [isConnecting, setIsConnecting] = useState<boolean>(false)

  // 연결 재시도 횟수 및 타임아웃 ID
  const retryCountRef = useRef<number>(0)
  const maxRetries = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 현재 메시지에 대한 연결 완료 상태 추가 (전역 상태가 아닌 현재 메시지에 대한 상태)
  const [currentMessageCompleted, setCurrentMessageCompleted] = useState<boolean>(false)

  // 활성 SSE ID 추적 (현재 처리 중인 메시지의 SSE ID)
  const activeSSEIdRef = useRef<string | null>(null)

  // 디버그 로그 함수 - 가장 먼저 정의
  const logDebug = useCallback(
    (message: string, data?: any) => {
      const timestamp = new Date().toISOString().substr(11, 8)
      const logMessage = data ? `[${timestamp}] ${message}: ${typeof data === "object" ? JSON.stringify(data) : data}` : `[${timestamp}] ${message}`

      if (debugMode) {
        setDebugMessages((prev) => [...prev, logMessage])
      }
      console.log(message, data)
    },
    [debugMode]
  )

  // SSE 연결 해제 함수 - 다른 함수들보다 먼저 정의
  const disconnectSSE = useCallback(() => {
    // 재연결 타임아웃이 있으면 제거
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      logDebug("SSE 연결 해제")

      // 이벤트 핸들러 제거
      eventSourceRef.current.onopen = null
      eventSourceRef.current.onmessage = null
      eventSourceRef.current.onerror = null

      // 연결 종료
      eventSourceRef.current.close()
      eventSourceRef.current = null

      // 상태 업데이트
      setSSEConnected(false)
      setIsConnecting(false)

      // 중요: currentSSEId를 null로 설정하여 재연결 방지
      setCurrentSSEId(null)

      // 활성 SSE ID 초기화
      activeSSEIdRef.current = null

      logDebug("SSE 연결이 성공적으로 종료되었습니다.")
    }
  }, [logDebug])

  // SSE 메시지 핸들러 - disconnectSSE 다음에 정의
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        logDebug("SSE 메시지 수신", event.data)

        // 현재 메시지가 이미 완료되었고 새 메시지가 시작되지 않았다면 처리하지 않음
        // activeSSEIdRef.current가 null이 아니면 새 메시지가 시작된 것으로 간주
        if (currentMessageCompleted && !activeSSEIdRef.current) {
          logDebug("이전 메시지가 완료되었고 새 메시지가 시작되지 않음, 처리 무시")
          return
        }

        // 데이터 파싱 시도
        let parsedData: SSEResponse | null = null

        try {
          parsedData = JSON.parse(event.data)
          logDebug("JSON 파싱 성공", parsedData)
        } catch (e) {
          logDebug("JSON 파싱 실패, 원본 데이터 사용", event.data)

          // data: {"token": "..."} 형식 처리 시도
          if (event.data.startsWith("data:")) {
            try {
              const jsonStr = event.data.substring(5).trim()
              parsedData = JSON.parse(jsonStr)
              logDebug("data: 접두사 제거 후 JSON 파싱 성공", parsedData)
            } catch (e2) {
              logDebug("data: 접두사 제거 후에도 JSON 파싱 실패", e2)
              // 원본 데이터를 텍스트로 처리
              parsedData = { text: event.data }
            }
          } else {
            // 원본 데이터를 텍스트로 처리
            parsedData = { text: event.data }
          }
        }

        // 에러 메시지 처리
        if (parsedData && parsedData.error) {
          logDebug("에러 메시지 감지", parsedData.error)
          setSSEError(parsedData.error)
          return
        }

        // 토큰 처리 - 문자 단위로 누적
        if (parsedData && parsedData.token) {
          logDebug("토큰 감지", parsedData.token)
          setAccumulatedText((prev) => prev + parsedData!.token!)
        }

        // 텍스트 처리
        if (parsedData && parsedData.text) {
          logDebug("텍스트 감지", parsedData.text)
          // 텍스트에서 토큰 추출 시도
          const tokenMatch = String(parsedData.text).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            logDebug("텍스트에서 토큰 추출", token)
            setAccumulatedText((prev) => prev + token)
          }
        }

        // 청크 처리
        if (parsedData && parsedData.chunk) {
          logDebug("청크 감지", parsedData.chunk)
          // 디버깅 메시지에서 토큰 추출 시도
          const tokenMatch = String(parsedData.chunk).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            logDebug("청크에서 토큰 추출", token)
            setAccumulatedText((prev) => prev + token)
          }
        }

        // 버전 정보가 있으면 시스템 응답 업데이트
        if (parsedData && parsedData.versionInfo) {
          logDebug("버전 정보 감지", parsedData.versionInfo)
          setSystemResponse({
            streamId: currentSSEId || "",
            status: parsedData.status || "MODIFIED",
            versionInfo: parsedData.versionInfo,
          } as SSEIdResponse)
        }

        // 완료 메시지가 오면 연결 종료
        if (
          (parsedData && parsedData.status === "COMPLETED") ||
          (parsedData && parsedData.message && (parsedData.message.includes("완료") || parsedData.message.includes("SSE 연결이 종료") || parsedData.message.includes("종료"))) ||
          (parsedData && parsedData.token && parsedData.token.includes("완료")) ||
          (parsedData && parsedData.done === true)
        ) {
          logDebug("완료 메시지 감지, 연결 종료")

          // 현재 메시지에 대한 완료 상태 설정
          setCurrentMessageCompleted(true)

          // 연결 종료
          disconnectSSE()

          // 약간의 지연 후 채팅 내역 새로고침 (연결 종료 후 서버가 상태를 줌)
          setTimeout(() => {
            onRefresh()
            // 새 메시지를 위한 준비 - 완료 상태 초기화
            setCurrentMessageCompleted(false)
          }, 500)
        }
      } catch (err) {
        console.error("SSE 메시지 처리 오류:", err)
        logDebug("SSE 메시지 처리 오류", err)
      }
    },
    [currentMessageCompleted, currentSSEId, disconnectSSE, logDebug, onRefresh, activeSSEIdRef]
  )

  // 재연결 처리 함수 - 순환 참조 방지를 위해 connectToSSE 함수 참조 제거
  const handleReconnect = useCallback(() => {
    // 현재 메시지가 이미 완료되었다면 재연결 시도하지 않음
    if (currentMessageCompleted) {
      logDebug("현재 메시지가 이미 완료됨, 재연결 시도 무시")
      return
    }

    // 이미 최대 재시도 횟수를 초과했는지 확인
    if (retryCountRef.current >= maxRetries) {
      logDebug(`최대 재시도 횟수(${maxRetries})를 초과했습니다. 재연결 중단.`)
      setSSEError(`서버 연결 실패: 최대 재시도 횟수(${maxRetries})를 초과했습니다.`)
      setIsConnecting(false)
      return
    }

    // 재시도 횟수 증가
    retryCountRef.current++

    // 지수 백오프를 사용한 재연결 지연 시간 계산 (1초, 2초, 4초, 8초, 16초)
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 16000)

    logDebug(`${delay}ms 후 재연결 시도 (${retryCountRef.current}/${maxRetries})`)
    setSSEError(`연결 실패: ${delay / 1000}초 후 재연결 시도 (${retryCountRef.current}/${maxRetries})`)

    // 기존 타임아웃이 있으면 제거
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    // 타임아웃 설정 - 직접 connectToSSE 호출 대신 상태 변경으로 처리
    reconnectTimeoutRef.current = setTimeout(() => {
      // 연결이 이미 성공적으로 설정되었는지 확인
      if (!sseConnected && !eventSourceRef.current && currentSSEId && !currentMessageCompleted) {
        logDebug(`재연결 시도 ${retryCountRef.current}/${maxRetries}`)
        // 재연결 트리거를 위한 상태 업데이트
        setCurrentSSEId((prevId) => {
          if (prevId) {
            // connectToSSE 함수를 직접 호출하지 않고 useEffect에서 처리하도록 함
            return prevId + "_reconnect"
          }
          return prevId
        })
      }
    }, delay)
  }, [currentMessageCompleted, currentSSEId, logDebug, maxRetries, sseConnected])

  // SSE 에러 핸들러
  const handleSSEError = useCallback(
    (err: Event) => {
      console.error("SSE 연�� 오류:", err)
      logDebug("SSE 연결 오류", err)

      // 현재 메시지가 이미 완료되었다면 에러 처리하지 않음
      if (currentMessageCompleted) {
        logDebug("현재 메시지가 이미 완료됨, 에러 처리 무시")
        return
      }

      // 연결 상태 확인
      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          logDebug("SSE 연결이 닫혔습니다.")
          handleReconnect()
        } else if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
          logDebug("SSE 연결 중...")
          setSSEError("서버에 연결 중입니다. 잠시만 기다려 주세요.")
        } else {
          setSSEError("서버 이벤트 스트림 연결 중 오류가 발생했습니다.")
        }
      }
    },
    [currentMessageCompleted, handleReconnect, logDebug]
  )

  // SSE 연결 함수 - 다른 함수들 다음에 정의
  const connectToSSE = useCallback(
    (sseId: string) => {
      // 새로운 SSE ID로 연결 시도하는 경우 완료 상태 초기화
      if (sseId !== activeSSEIdRef.current) {
        logDebug(`새로운 SSE ID(${sseId})로 연결 시도, 완료 상태 초기화`)
        setCurrentMessageCompleted(false)
      } else if (currentMessageCompleted) {
        // 같은 SSE ID로 재연결 시도하는데 이미 완료된 경우
        logDebug("이미 완료된 메시지에 대한 재연결 시도, 무시")
        return
      }

      // 이미 연결 중이면 중복 연결 방지
      if (isConnecting && eventSourceRef.current) {
        logDebug("이미 SSE 연결 중입니다. 중복 연결 방지")
        return
      }

      // 기존 연결이 있으면 해제
      disconnectSSE()

      // 활성 SSE ID 설정
      activeSSEIdRef.current = sseId

      setIsConnecting(true)
      setCurrentSSEId(sseId)
      setSSEError(null)

      try {
        logDebug(`SSE 연결 시작: ${sseId}`)

        // SSE 연결 설정
        const eventSource = new EventSource(`/api/sse/connect/${sseId}`)
        eventSourceRef.current = eventSource

        // 연결 성공 이벤트
        eventSource.onopen = () => {
          logDebug("SSE 연결 성공")
          setSSEConnected(true)
          setSSEError(null)
          setIsConnecting(false)
          retryCountRef.current = 0 // 연결 성공 시 재시도 카운트 초기화
        }

        // 메시지 수신 이벤트
        eventSource.onmessage = handleSSEMessage

        // 에러 이벤트
        eventSource.onerror = handleSSEError
      } catch (err) {
        console.error("SSE 연결 설정 오류:", err)
        logDebug("SSE 연결 설정 오류", err)
        setSSEError("서버 이벤트 스트림 연결을 설정하는 중 오류가 발생했습니다.")
        setSSEConnected(false)
        setIsConnecting(false)

        // 연결 설정 오류 시 재연결 시도
        handleReconnect()
      }
    },
    [currentMessageCompleted, disconnectSSE, handleReconnect, handleSSEError, handleSSEMessage, isConnecting, logDebug, activeSSEIdRef]
  )

  // currentSSEId가 변경될 때 SSE 연결 처리
  useEffect(() => {
    if (currentSSEId && !sseConnected && !isConnecting && !currentMessageCompleted) {
      // 재연결 요청인 경우 원래 ID로 복원
      const originalId = currentSSEId.replace("_reconnect", "")
      connectToSSE(originalId)
    }
  }, [connectToSSE, currentMessageCompleted, currentSSEId, isConnecting, sseConnected])

  // 채팅 메시지 스크롤 처리
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatData, accumulatedText, debugMessages])

  // 컴포넌트 언마운트 시 SSE 연결 해제
  useEffect(() => {
    return () => {
      disconnectSSE()
    }
  }, [disconnectSSE])

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!message.trim() || sending || sseConnected || isConnecting) return

    // 기존 SSE 연결이 있으면 먼저 종료
    if (eventSourceRef.current) {
      logDebug("기존 SSE 연결 종료 후 새 메시지 전송")
      disconnectSSE()

      // 연결이 완전히 종료될 시간을 주기 위해 짧은 지연 추가
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // 재시도 카운터 초기화
    retryCountRef.current = 0

    // 새 메시지를 위한 상태 초기화
    setCurrentMessageCompleted(false)
    setAccumulatedText("")
    setSystemResponse(null)
    setSSEError(null)

    try {
      setSending(true)
      setSendError(null)
      setDebugMessages([]) // 디버그 메시지 초기화

      // 전송할 메시지 저장
      const sentMessage = message
      setLastSentMessage(sentMessage)

      // 타겟 메서드 ID 추출
      const targetMethods = targetNodes.length > 0 ? targetNodes.filter((target) => target.type === "method").map((target) => ({ methodId: target.id.replace("method-", "") })) : [{ methodId: "463" }] // 기본값

      // 채팅 메시지 데이터 구성
      const chatMessageData = {
        tag: "IMPLEMENT",
        promptType: "BODY",
        message: sentMessage,
        targetMethods,
      }

      logDebug("요청 데이터", {
        url: `/api/chat/${projectId}/${apiId}`,
        method: "POST",
        data: chatMessageData,
      })

      // 메시지 입력 필드 초기화 (요청 전에 초기화)
      setMessage("")

      // API 호출하여 채팅 메시지 전송
      const response = await axios.post<SSEIdResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData)

      logDebug("채팅 메시지 전송 성공", response.data)

      // SSE ID를 받아서 SSE 연결 시작
      if (response.data && response.data.streamId) {
        connectToSSE(response.data.streamId)
      } else {
        setSendError("SSE ID를 받지 못했습니다.")
        logDebug("SSE ID를 받지 못함")
      }
    } catch (err) {
      console.error("채팅 메시지 전송 오류:", err)
      logDebug("채팅 메시지 전송 오류", err)

      if (axios.isAxiosError(err)) {
        logDebug("에러 응답 상태", err.response?.status)
        logDebug("에러 응답 데이터", err.response?.data)
        setSendError(err.response?.data?.error || err.message)
      } else {
        logDebug("일반 에러", err)
        setSendError("메시지 전송 중 오류가 발생했습니다.")
      }
    } finally {
      setSending(false)
    }
  }

  // 타겟 제거 핸들러
  const handleRemoveTarget = (nodeId: string) => {
    if (onRemoveTarget) {
      onRemoveTarget(nodeId)
    }
  }

  // 디버그 모드 토글
  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="h-full p-4 bg-white rounded-lg shadow flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="h-full p-4 bg-white rounded-lg shadow">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border-l-4 border-red-500">
          <h3 className="font-semibold mb-2">오류 발생</h3>
          <p>{error}</p>
          <button onClick={() => onRefresh()} className="mt-2 px-3 py-1 bg-white text-red-600 rounded border border-red-300 flex items-center gap-1 text-sm">
            <RefreshCw size={14} />
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  // 채팅 항목 추출
  const chatItems = chatData?.content || []

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {/* 채팅 헤더 */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="font-semibold">채팅</h2>
          <div className="text-xs text-gray-500">
            프로젝트: {projectId} / API: {apiId} / 버전: {versionId}
          </div>
          {(sseConnected || isConnecting) && (
            <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{isConnecting ? "연결 중..." : "실시간 연결됨"}</span>
            </div>
          )}
        </div>
        <div>
          <button onClick={toggleDebugMode} className={`px-2 py-1 text-xs rounded ${debugMode ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}>
            디버그 모드 {debugMode ? "켜짐" : "꺼짐"}
          </button>
        </div>
      </div>

      {/* 메시지 전송 오류 */}
      {(sendError || sseError) && (
        <div className="px-4 py-2 bg-red-50 text-red-600 border-b">
          <p className="text-sm">{sendError || sseError}</p>
        </div>
      )}

      {/* 선택된 타겟 표시 */}
      {targetNodes.length > 0 ? (
        <div className="px-4 py-3 bg-gray-100 border-b">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-gray-700">선택된 타겟:</div>
            <div className="flex flex-wrap gap-2">
              {targetNodes.map((target) => (
                <div key={target.id} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  <span>
                    {target.type === "class" && "클래스: "}
                    {target.type === "interface" && "인터페이스: "}
                    {target.type === "method" && "메서드: "}
                    {target.name}
                  </span>
                  <button onClick={() => handleRemoveTarget(target.id)} className="ml-1 p-0.5 rounded-full bg-red-200 hover:bg-red-300 transition-colors" aria-label={`${target.name} 타겟 제거`}>
                    <X size={12} className="text-red-700" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 bg-gray-100 border-b">
          <div className="text-xs font-medium text-gray-700">타겟: 전체 API</div>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {/* 기존 채팅 내역 */}
        {chatItems.length > 0 ? (
          chatItems.map((item, index) => (
            <div key={`${item.chatId}-${index}`} className="mb-6">
              {/* 사용자 메시지 */}
              {item.userChat && (
                <div className="flex justify-end mb-2">
                  <div className="max-w-[80%] p-3 rounded-lg bg-blue-500 text-white rounded-tr-none">{item.userChat.message}</div>
                </div>
              )}

              {/* 시스템 응답 */}
              {item.systemChat && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
                    <div className="text-sm">{item.systemChat.versionInfo?.description || "시스템 응답"}</div>
                    {item.systemChat.versionInfo && <div className="mt-1 text-xs text-gray-500">버전: {item.systemChat.versionInfo.newVersionId}</div>}
                  </div>
                </div>
              )}

              {/* 타임스탬프 */}
              <div className="text-center mt-1 mb-4">
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">채팅 내역이 없습니다.</div>
        )}

        {/* 현재 SSE 메시지 표시 - 누적 텍스트 사용 */}
        {(sseConnected || isConnecting || accumulatedText) && (
          <div className="mb-6">
            {/* 사용자 메시지 (가장 최근에 보낸 메시지) */}
            <div className="flex justify-end mb-2">
              <div className="max-w-[80%] p-3 rounded-lg bg-blue-500 text-white rounded-tr-none">{lastSentMessage}</div>
            </div>

            {/* SSE 응답 메시지 */}
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
                <div className="text-sm whitespace-pre-wrap">
                  {accumulatedText}
                  {(sseConnected || isConnecting) && <span className="inline-block ml-1 w-2 h-4 bg-gray-500 animate-pulse"></span>}
                </div>
                {(sseConnected || isConnecting) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>{isConnecting ? "연결 중..." : "처리 중..."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="text-center mt-1 mb-4">
              <span className="text-xs text-gray-400">{new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 디버그 정보 표시 */}
        {debugMode && debugMessages.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-medium text-gray-700">디버그 로그:</h3>
              <button onClick={() => setDebugMessages([])} className="text-xs px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300">
                지우기
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto text-xs font-mono">
              {debugMessages.map((msg, idx) => (
                <div key={idx} className="py-0.5 border-b border-gray-200 last:border-0">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 시스템 응답 표시 (있는 경우) */}
        {systemResponse && !sseConnected && !isConnecting && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">시스템 응답:</div>
            {systemResponse.versionInfo && (
              <div className="text-sm">
                <p>{systemResponse.versionInfo.description}</p>
                <p className="text-xs mt-1">버전: {systemResponse.versionInfo.newVersionId}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && !sseConnected && !isConnecting && handleSendMessage()}
            placeholder={sseConnected || isConnecting ? "처리 중입니다..." : "메시지를 입력하세요..."}
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || sseConnected || isConnecting}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || sseConnected || isConnecting}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending || isConnecting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {(sseConnected || isConnecting) && (
          <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <AlertCircle size={12} />
            <span>AI가 응답을 생성하는 중입니다. 잠시만 기다려주세요.</span>
          </div>
        )}
      </div>
    </div>
  )
}
