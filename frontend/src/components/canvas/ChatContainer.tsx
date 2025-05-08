// components/canvas/ChatContainer.tsx
"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ChatHistoryResponse, SystemChatResponse } from "@generated/model" // 타입 임포트 추가

// props 타입 정의
type ChatContainerProps = {
  projectId: string
  apiId: string
  versionId: string
  chatData: ChatHistoryResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export default function ChatContainer({ projectId, apiId, versionId, chatData, loading, error, onRefresh }: ChatContainerProps) {
  // 메시지 입력 상태
  const [message, setMessage] = useState<string>("")
  // 메시지 전송 중 상태
  const [sending, setSending] = useState<boolean>(false)
  // 메시지 전송 오류 상태
  const [sendError, setSendError] = useState<string | null>(null)
  // 시스템 응답 상태 추가
  const [systemResponse, setSystemResponse] = useState<SystemChatResponse | null>(null)

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setSending(true)
      setSendError(null)
      setSystemResponse(null) // 새 메시지 전송 시 이전 시스템 응답 초기화

      // 채팅 메시지 데이터 구성
      const chatMessageData = {
        tag: "IMPLEMENT",
        promptType: "BODY",
        message: message, // 사용자가 입력한 메시지
        targetMethods: [
          {
            methodId: "method-463", // 고정 값 사용
          },
        ],
      }

      // 요청 데이터 콘솔에 출력
      console.log("요청 데이터:", {
        url: `/api/chat/${projectId}/${apiId}`,
        method: "POST",
        data: chatMessageData,
      })

      // API 호출하여 채팅 메시지 전송
      const response = await axios.post<SystemChatResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData)

      // 응답 데이터 콘솔에 자세히 출력
      console.log("%c 채팅 메시지 전송 성공", "color: green; font-weight: bold")
      console.log("응답 상태 코드:", response.status)
      console.log("응답 헤더:", response.headers)
      console.log("응답 데이터:", response.data)

      // 데이터 구조 확인을 위한 상세 로깅
      if (response.data) {
        console.log("응답 데이터 타입:", typeof response.data)
        console.log("응답 데이터 키:", Object.keys(response.data))

        // 중첩된 객체나 배열 확인
        Object.entries(response.data).forEach(([key, value]) => {
          console.log(`${key} 타입:`, typeof value)
          console.log(`${key} 값:`, value)
        })
      }

      // 시스템 응답 저장
      setSystemResponse(response.data)

      // 메시지 입력 필드 초기화
      setMessage("")

      // 채팅 데이터 갱신
      console.log("채팅 데이터 갱신 시작...")
      await onRefresh()
      console.log("채팅 데이터 갱신 완료")
    } catch (err) {
      console.error("%c 채팅 메시지 전송 오류", "color: red; font-weight: bold", err)

      // 에러 상세 정보 로깅
      if (axios.isAxiosError(err)) {
        console.error("에러 응답 상태:", err.response?.status)
        console.error("에러 응답 데이터:", err.response?.data)
        console.error("에러 설정:", err.config)

        setSendError(err.response?.data?.error || err.message)
      } else {
        console.error("일반 에러:", err)
        setSendError("메시지 전송 중 오류가 발생했습니다.")
      }
    } finally {
      setSending(false)
    }
  }

  // 컴포넌트 마운트 시 채팅 데이터 로깅
  useEffect(() => {
    console.log("현재 채팅 데이터:", chatData)
    if (chatData) {
      console.log("채팅 데이터 구조:", Object.keys(chatData))
    }
  }, [chatData])

  return (
    <div className="h-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">채팅</h2>

      <div className="p-3 bg-gray-50 rounded mb-4">
        <p className="text-sm text-gray-600">
          <strong>프로젝트:</strong> {projectId}
          <br />
          <strong>API:</strong> {apiId}
          <br />
          <strong>버전:</strong> {versionId}
        </p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 메시지 전송 오류 */}
      {sendError && (
        <div className="p-3 bg-red-50 text-red-600 rounded mb-4">
          <p className="text-sm font-semibold">메시지 전송 오류:</p>
          <p className="text-sm">{sendError}</p>
        </div>
      )}

      {/* 채팅 데이터 표시 영역 */}
      <div className="flex flex-col h-[calc(100%-12rem)] border border-gray-200 rounded mb-4">
        <div className="flex-grow p-3 overflow-y-auto">
          {/* 채팅 기록 표시 */}
          {chatData ? (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">채팅 기록:</h3>
              <pre className="text-xs whitespace-pre-wrap overflow-auto bg-gray-50 p-3 rounded">{JSON.stringify(chatData, null, 2)}</pre>
            </div>
          ) : (
            !loading && <div className="text-center text-gray-500 p-4 mb-4">채팅 기록이 없습니다.</div>
          )}

          {/* 최근 시스템 응답 표시 (있는 경우) */}
          {systemResponse && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2 text-green-600">최근 응답:</h3>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <pre className="text-xs whitespace-pre-wrap overflow-auto">{JSON.stringify(systemResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border border-gray-200 rounded p-2">
        <div className="flex">
          <input
            type="text"
            placeholder="메시지 입력..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={sending || loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
          >
            {sending ? "전송 중..." : "전송"}
          </button>
        </div>
      </div>
    </div>
  )
}
