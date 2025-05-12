"use client"

import { useState, useRef, useEffect } from "react"
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
  message?: string
  status?: string
  versionInfo?: {
    newVersionId: string
    description: string
  }
  error?: string
}

export default function ChatContainer({ projectId, apiId, versionId, chatData, loading, error, onRefresh, targetNodes, onRemoveTarget }: ChatContainerProps) {
  const [systemResponse, setSystemResponse] = useState<SSEIdResponse | null>(null)
  const [message, setMessage] = useState<string>("")
  const [sending, setSending] = useState<boolean>(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // SSE 관련 상태 추가
  const [sseConnected, setSSEConnected] = useState<boolean>(false)
  const [sseMessages, setSSEMessages] = useState<string[]>([])
  const [currentSSEId, setCurrentSSEId] = useState<string | null>(null)
  const [sseError, setSSEError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // 채팅 메시지 스크롤 처리
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatData, sseMessages])

  // SSE 연결 해제 함수
  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      console.log("SSE 연결 해제")
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setSSEConnected(false)
    }
  }

  // 컴포넌트 언마운트 시 SSE 연결 해제
  useEffect(() => {
    return () => {
      disconnectSSE()
    }
  }, [])

  // SSE 연결 함수를 수정하여 더 나은 오류 처리와 재연결 로직 추가
  const connectToSSE = (sseId: string) => {
    // 기존 연결이 있으면 해제
    disconnectSSE()

    try {
      console.log(`SSE 연결 시작: ${sseId}`)
      setCurrentSSEId(sseId)
      setSSEError(null)

      // SSE 연결 설정
      const eventSource = new EventSource(`/api/sse/connect/${sseId}`)
      eventSourceRef.current = eventSource

      // 연결 시도 횟수 추적을 위한 변수
      let retryCount = 0
      const maxRetries = 3

      // 연결 성공 이벤트
      eventSource.onopen = () => {
        console.log("SSE 연결 성공")
        setSSEConnected(true)
        setSSEError(null)
        retryCount = 0 // 연결 성공 시 재시도 카운트 초기화
      }

      // 메시지 수신 이벤트
      eventSource.onmessage = (event) => {
        console.log("SSE 메시지 수신:", event.data)
        try {
          // 데이터 파싱 시도
          let parsedData: SSEResponse | null = null

          // 데이터 형식에 따라 파싱 방법 분기
          if (event.data.startsWith("data: ")) {
            // "data: {...}" 형식인 경우
            const jsonStr = event.data.substring(6)
            try {
              parsedData = JSON.parse(jsonStr)
            } catch (e) {
              // JSON 파싱 실패 시 문자열 그대로 사용
              parsedData = { message: jsonStr }
              console.log(e)
            }
          } else {
            // 일반 텍스트인 경우
            try {
              // 먼저 JSON으로 파싱 시도
              parsedData = JSON.parse(event.data)
            } catch (e) {
              // 파싱 실패 시 문자열 그대로 사용
              parsedData = { message: event.data }
              console.log(e)
            }
          }

          if (parsedData) {
            // 메시지 추가
            setSSEMessages((prev) => [...prev, parsedData?.message || parsedData?.token || JSON.stringify(parsedData)])

            // 버전 정보가 있으면 시스템 응답 업데이트
            if (parsedData.versionInfo) {
              setSystemResponse({
                streamId: currentSSEId || "",
                status: parsedData.status || "MODIFIED",
                versionInfo: parsedData.versionInfo,
              } as SSEIdResponse)
            }

            // 완료 메시지가 오면 연결 종료
            if (parsedData.status === "COMPLETED" || parsedData.message?.includes("완료") || parsedData.token?.includes("완료")) {
              disconnectSSE()
              onRefresh() // 채팅 내역 새로고침
            }
          }
        } catch (err) {
          console.error("SSE 메시지 처리 오류:", err)
          setSSEMessages((prev) => [...prev, `메시지 처리 오류: ${event.data}`])
        }
      }

      // 에러 이벤트
      eventSource.onerror = (err) => {
        console.error("SSE 연결 오류:", err)

        // 연결 상태 확인
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("SSE 연결이 닫혔습니다.")

          // 최대 재시도 횟수를 초과하지 않았다면 재연결 시도
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`SSE 재연결 시도 (${retryCount}/${maxRetries})...`)

            // 이전 연결 종료
            eventSource.close()

            // 잠시 후 재연결 시도
            setTimeout(() => {
              const newEventSource = new EventSource(`/api/sse/connect/${sseId}`)
              eventSourceRef.current = newEventSource

              // 이벤트 핸들러 다시 설정
              newEventSource.onopen = eventSource.onopen
              newEventSource.onmessage = eventSource.onmessage
              newEventSource.onerror = eventSource.onerror
            }, 2000) // 2초 후 재시도

            return
          }

          // 최대 재시도 횟수 초과 시 오류 표시
          setSSEError("서버 연결이 종료되었습니다. 다시 시도해 주세요.")
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          console.log("SSE 연결 중...")
          setSSEError("서버에 연결 중입니다. 잠시만 기다려 주세요.")
        } else {
          setSSEError("서버 이벤트 스트림 연결 중 오류가 발생했습니다.")
        }

        // 연결 상태 업데이트
        setSSEConnected(eventSource.readyState === EventSource.OPEN)

        // 최대 재시도 횟수 초과 시 연결 종료
        if (retryCount >= maxRetries) {
          disconnectSSE()
        }
      }
    } catch (err) {
      console.error("SSE 연결 설정 오류:", err)
      setSSEError("서버 이벤트 스트림 연결을 설정하는 중 오류가 발생했습니다.")
      setSSEConnected(false)
    }
  }

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setSending(true)
      setSendError(null)
      setSystemResponse(null)
      setSSEMessages([]) // SSE 메시지 초기화

      // 타겟 메서드 ID 추출
      const targetMethods = targetNodes.length > 0 ? targetNodes.filter((target) => target.type === "method").map((target) => ({ methodId: target.id.replace("method-", "") })) : [{ methodId: "463" }] // 기본값

      // 채팅 메시지 데이터 구성
      const chatMessageData = {
        tag: "IMPLEMENT",
        promptType: "BODY",
        message: message,
        targetMethods,
      }

      console.log("요청 데이터:", {
        url: `/api/chat/${projectId}/${apiId}`,
        method: "POST",
        data: chatMessageData,
      })

      // API 호출하여 채팅 메시지 전송 - 반환 타입을 SSEIdResponse로 변경
      const response = await axios.post<SSEIdResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData)

      console.log("채팅 메시지 전송 성공:", response.data)

      // SSE ID를 받아서 SSE 연결 시작
      if (response.data && response.data.streamId) {
        connectToSSE(response.data.streamId)
      } else {
        setSendError("SSE ID를 받지 못했습니다.")
      }

      // 메시지 입력 필드 초기화
      setMessage("")
    } catch (err) {
      console.error("채팅 메시지 전송 오류:", err)

      if (axios.isAxiosError(err)) {
        console.error("에러 응답 상태:", err.response?.status)
        console.error("에러 응답 데이터:", err.response?.data)
        setSendError(err.response?.data?.error || err.message)
      } else {
        console.error("일반 에러:", err)
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
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold">채팅</h2>
        <div className="text-xs text-gray-500">
          프로젝트: {projectId} / API: {apiId} / 버전: {versionId}
        </div>
        {sseConnected && (
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>실시간 연결됨</span>
          </div>
        )}
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

        {/* 현재 SSE 메시지 표시 */}
        {sseMessages.length > 0 && (
          <div className="mb-6">
            {/* 사용자 메시지 (가장 최근에 보낸 메시지) */}
            <div className="flex justify-end mb-2">
              <div className="max-w-[80%] p-3 rounded-lg bg-blue-500 text-white rounded-tr-none">{message}</div>
            </div>

            {/* SSE 응답 메시지 */}
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
                <div className="text-sm whitespace-pre-wrap">
                  {sseMessages.map((msg, idx) => (
                    <div key={idx} className="mb-1">
                      {msg}
                    </div>
                  ))}
                  {sseConnected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>처리 중...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="text-center mt-1 mb-4">
              <span className="text-xs text-gray-400">{new Date().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 최근 시스템 응답 표시 (있는 경우) */}
        {systemResponse && !sseConnected && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">시스템 응답:</div>
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
            onKeyDown={(e) => e.key === "Enter" && !sending && !sseConnected && handleSendMessage()}
            placeholder={sseConnected ? "처리 중입니다..." : "메시지를 입력하세요..."}
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || sseConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || sseConnected}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {sseConnected && (
          <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
            <AlertCircle size={12} />
            <span>AI가 응답을 생성하는 중입니다. 잠시만 기다려주세요.</span>
          </div>
        )}
      </div>
    </div>
  )
}
