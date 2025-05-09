"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { Send, RefreshCw, X } from "lucide-react"
import type { ChatHistoryResponse, SystemChatResponse } from "@generated/model"
import type { TargetNode } from "./DiagramContainer" // 타겟 노드 타입 임포트

type ChatContainerProps = {
  projectId: string
  apiId: string
  versionId: string
  chatData: ChatHistoryResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
  targetNodes: TargetNode[] // 타겟 노드 배열로 변경
  onRemoveTarget: (nodeId: string) => void // 타겟 제거 콜백 추가
}

export default function ChatContainer({ projectId, apiId, versionId, chatData, loading, error, onRefresh, targetNodes, onRemoveTarget }: ChatContainerProps) {
  // systemResponse 상태 타입 수정
  const [systemResponse, setSystemResponse] = useState<SystemChatResponse | null>(null)
  const [message, setMessage] = useState<string>("")
  const [sending, setSending] = useState<boolean>(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 채팅 메시지 스크롤 처리
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatData])

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setSending(true)
      setSendError(null)
      setSystemResponse(null) // 새 메시지 전송 시 이전 시스템 응답 초기화

      // 타겟 메서드 ID 추출
      const targetMethods = targetNodes.length > 0 ? targetNodes.filter((target) => target.type === "method").map((target) => ({ methodId: target.id })) : [{ methodId: "method-463" }] // 기본값

      // 채팅 메시지 데이터 구성
      const chatMessageData = {
        tag: "IMPLEMENT",
        promptType: "BODY",
        message: message, // 사용자가 입력한 메시지
        targetMethods, // 선택된 메서드 타겟 사용
      }

      // 요청 데이터 콘솔에 출력
      console.log("요청 데이터:", {
        url: `/api/chat/${projectId}/${apiId}`,
        method: "POST",
        data: chatMessageData,
        targetNodes,
      })

      // API 호출하여 채팅 메시지 전송
      const response = await axios.post<SystemChatResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData)

      // 응답 데이터 콘솔에 자세히 출력
      console.log("%c 채팅 메시지 전송 성공", "color: green; font-weight: bold")
      console.log("응답 상태 코드:", response.status)
      console.log("응답 데이터:", response.data)

      // 시스템 응답 저장
      setSystemResponse(response.data)

      // 메시지 입력 필드 초기화
      setMessage("")

      // 채팅 데이터 갱신
      await onRefresh()
    } catch (err) {
      console.error("%c 채팅 메시지 전송 오류", "color: red; font-weight: bold", err)

      // 에러 상세 정보 로깅
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

  // 채팅 항목 추출 부분 수정
  const chatItems = chatData?.content || []

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {/* 채팅 헤더 */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold">채팅</h2>
        <div className="text-xs text-gray-500">
          프로젝트: {projectId} / API: {apiId} / 버전: {versionId}
        </div>
      </div>

      {/* 메시지 전송 오류 */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 border-b">
          <p className="text-sm">{sendError}</p>
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

      {/* 채팅 메시지 영역 부분 수정 */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
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

        {/* 최근 시스템 응답 표시 (있는 경우) */}
        {systemResponse && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">시스템 응답:</div>
            <div className="text-sm text-gray-800">{systemResponse.status === "MODIFIED" && systemResponse.versionInfo ? systemResponse.versionInfo.description : "처리 완료"}</div>
            {systemResponse.versionInfo && <div className="mt-1 text-xs text-gray-500">버전: {systemResponse.versionInfo.newVersionId}</div>}
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
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
