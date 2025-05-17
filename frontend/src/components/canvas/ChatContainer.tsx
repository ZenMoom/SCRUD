"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, Send, RefreshCw, X, AlertCircle, Info } from "lucide-react"
import type { ChatHistoryResponse } from "@generated/model"
import type { TargetNode } from "./DiagramContainer"
import axios from "axios"
import useAuthStore from "@/app/store/useAuthStore"

// 채팅 컨테이너 속성 타입 정의
interface ChatContainerProps {
  projectId: string
  apiId: string
  versionId: string
  chatData: ChatHistoryResponse | null
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
  targetNodes: TargetNode[]
  onVersionSelect?: (versionId: string) => void
  onNewVersionInfo?: (versionInfo: { newVersionId: string; description: string }) => void
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

// SSEIdResponse 인터페이스 정의
interface SSEIdResponse {
  streamId?: string
}

// 채팅 메시지 타입 정의
interface ChatMessage {
  id: string
  type: "user" | "system" | "version"
  message: string
  timestamp: string
  versionInfo?: {
    versionId: string
    description: string
  }
  targetMethods?: Array<{ methodId: string }>
  tag?: string
}

// 요청 태그 타입 정의
type RequestTag = "EXPLAIN" | "REFACTORING" | "OPTIMIZE" | "IMPLEMENT"

export default function ChatContainer({ projectId, apiId, versionId, chatData, loading, error, onRefresh, targetNodes, onVersionSelect, onNewVersionInfo }: ChatContainerProps) {
  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [lastSentMessage, setLastSentMessage] = useState<string>("")
  const [sending, setSending] = useState<boolean>(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<RequestTag>("EXPLAIN")
  const [sseConnected, setSSEConnected] = useState<boolean>(false)
  const [currentSSEId, setCurrentSSEId] = useState<string | null>(null)
  const [sseError, setSSEError] = useState<string | null>(null)
  const [accumulatedText, setAccumulatedText] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [currentMessageCompleted, setCurrentMessageCompleted] = useState<boolean>(false)
  const [versionInfo, setVersionInfo] = useState<{ newVersionId: string; description: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [shouldShowTempMessage, setShouldShowTempMessage] = useState<boolean>(true)

  // 참조 변수
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeSSEIdRef = useRef<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { token } = useAuthStore()

  // SSE 연결 해제 함수
  const disconnectSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.onopen = null
      eventSourceRef.current.onmessage = null
      eventSourceRef.current.onerror = null
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setSSEConnected(false)
      setIsConnecting(false)
      setCurrentSSEId(null)
      activeSSEIdRef.current = null
    }
  }, [])

  // SSE 메시지 핸들러
  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        if (currentMessageCompleted && !activeSSEIdRef.current) {
          return
        }

        let parsedData: SSEResponse | null = null

        try {
          parsedData = JSON.parse(event.data)
        } catch {
          if (event.data.startsWith("data:")) {
            try {
              const jsonStr = event.data.substring(5).trim()
              parsedData = JSON.parse(jsonStr)
            } catch {
              parsedData = { text: event.data }
            }
          } else {
            parsedData = { text: event.data }
          }
        }

        if (parsedData && parsedData.error) {
          setSSEError(parsedData.error)
          return
        }

        if (parsedData && parsedData.token) {
          setAccumulatedText((prev) => prev + parsedData!.token!)
        }

        if (parsedData && parsedData.text) {
          const tokenMatch = String(parsedData.text).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            setAccumulatedText((prev) => prev + token)
          }
        }

        if (parsedData && parsedData.chunk) {
          const tokenMatch = String(parsedData.chunk).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            setAccumulatedText((prev) => prev + token)
          }
        }

        if (parsedData && parsedData.versionInfo) {
          console.log("SSE에서 새 버전 정보 감지:", parsedData.versionInfo)
          setVersionInfo(parsedData.versionInfo)

          // 새 버전 정보를 부모 컴포넌트에 즉시 전달
          if (onNewVersionInfo) {
            console.log("부모 컴포넌트에 새 버전 정보 전달:", parsedData.versionInfo)
            onNewVersionInfo(parsedData.versionInfo)
          }
        }

        if (
          (parsedData && parsedData.status === "COMPLETED") ||
          (parsedData && parsedData.message && (parsedData.message.includes("완료") || parsedData.message.includes("SSE 연결이 종료") || parsedData.message.includes("종료"))) ||
          (parsedData && parsedData.token && parsedData.token.includes("완료")) ||
          (parsedData && parsedData.done === true)
        ) {
          setCurrentMessageCompleted(true)
          disconnectSSE()

          setTimeout(() => {
            onRefresh().then(() => {
              // 채팅 내역 새로고침 후 임시 메시지 상태 초기화
              setShouldShowTempMessage(false)
              setAccumulatedText("")
              setLastSentMessage("")
            })
            setCurrentMessageCompleted(false)
          }, 500)
        }
      } catch (err) {
        console.error("SSE 메시지 처리 오류:", err)
      }
    },
    [currentMessageCompleted, disconnectSSE, onRefresh, onNewVersionInfo]
  )

  // 시스템 응답에서 버전 정보 감지 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (chatData && chatData.content && chatData.content.length > 0 && onVersionSelect && versionInfo) {
      const newVersionId = versionInfo.newVersionId
      if (newVersionId) {
        onVersionSelect(newVersionId)
      }
    }
  }, [chatData, onVersionSelect, versionInfo])

  // 채팅 데이터가 변경될 때 임시 메시지 초기화
  useEffect(() => {
    if (chatData && chatData.content) {
      // 채팅 내역이 로드되면 임시 메시지 상태 초기화
      setShouldShowTempMessage(false)

      // 마지막 메시지가 이미 채팅 내역에 포함되어 있는지 확인
      const lastMessageInHistory = chatData.content.some((item) => item.userChat?.message === lastSentMessage && lastSentMessage !== "")

      if (lastMessageInHistory) {
        setAccumulatedText("")
        setLastSentMessage("")
      }
    }
  }, [chatData, lastSentMessage])

  // 재연결 처리 함수
  const handleReconnect = useCallback(() => {
    if (currentMessageCompleted) {
      return
    }

    if (retryCountRef.current >= maxRetries) {
      setSSEError(`서버 연결 실패: 최대 재시도 횟수(${maxRetries})를 초과했습니다.`)
      setIsConnecting(false)
      return
    }

    retryCountRef.current++
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 16000)
    setSSEError(`연결 실패: ${delay / 1000}초 후 재연결 시도 (${retryCountRef.current}/${maxRetries})`)

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!sseConnected && !eventSourceRef.current && currentSSEId && !currentMessageCompleted) {
        setCurrentSSEId((prevId) => {
          if (prevId) {
            return prevId + "_reconnect"
          }
          return prevId
        })
      }
    }, delay)
  }, [currentMessageCompleted, currentSSEId, sseConnected])

  // SSE 에러 핸들러
  const handleSSEError = useCallback(
    (err: Event) => {
      console.error("SSE 연결 오류:", err)

      if (currentMessageCompleted) {
        return
      }

      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          handleReconnect()
        } else if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
          setSSEError("서버에 연결 중입니다. 잠시만 기다려 주세요.")
        } else {
          setSSEError("서버 이벤트 스트림 연결 중 오류가 발생했습니다.")
        }
      }
    },
    [currentMessageCompleted, handleReconnect]
  )

  // SSE 연결 함수
  const connectToSSE = useCallback(
    (sseId: string) => {
      if (sseId !== activeSSEIdRef.current) {
        setCurrentMessageCompleted(false)
      } else if (currentMessageCompleted) {
        return
      }

      if (isConnecting && eventSourceRef.current) {
        return
      }

      disconnectSSE()
      activeSSEIdRef.current = sseId
      setIsConnecting(true)
      setCurrentSSEId(sseId)
      setSSEError(null)
      setShouldShowTempMessage(true)

      try {
        const eventSource = new EventSource(`/api/sse/connect/${sseId}`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          setSSEConnected(true)
          setSSEError(null)
          setIsConnecting(false)
          retryCountRef.current = 0
        }

        eventSource.onmessage = handleSSEMessage
        eventSource.onerror = handleSSEError
      } catch (err) {
        console.error("SSE 연결 설정 오류:", err)
        setSSEError("서버 이벤트 스트림 연결을 설정하는 중 오류가 발생했습니다.")
        setSSEConnected(false)
        setIsConnecting(false)
        handleReconnect()
      }
    },
    [currentMessageCompleted, disconnectSSE, handleReconnect, handleSSEError, handleSSEMessage, isConnecting]
  )

  // currentSSEId가 변경될 때 SSE 연결 처리
  useEffect(() => {
    if (currentSSEId && !sseConnected && !isConnecting && !currentMessageCompleted) {
      const originalId = currentSSEId.replace("_reconnect", "")
      connectToSSE(originalId)
    }
  }, [connectToSSE, currentMessageCompleted, currentSSEId, isConnecting, sseConnected])

  // 채팅 데이터가 변경될 때 메시지 목록 업데이트
  useEffect(() => {
    if (chatData && chatData.content) {
      const formattedMessages: ChatMessage[] = []

      // 버전 1 버튼을 기본적으로 추가
      formattedMessages.push({
        id: `version-1-default`,
        type: "version",
        message: "초기 버전",
        timestamp: new Date().toISOString(),
        versionInfo: {
          versionId: "1",
          description: "초기 버전",
        },
      })

      chatData.content.forEach((item) => {
        // 사용자 메시지 추가
        if (item.userChat) {
          formattedMessages.push({
            id: `user-${item.chatId}`,
            type: "user",
            message: item.userChat.message || "",
            timestamp: item.createdAt,
            targetMethods: item.userChat.targetMethods,
            tag: item.userChat.tag as RequestTag,
          })
        }

        // 시스템 메시지 추가
        if (item.systemChat) {
          formattedMessages.push({
            id: `system-${item.systemChat.systemChatId || item.chatId}`,
            type: "system",
            message: item.systemChat.message || "",
            timestamp: item.createdAt,
          })

          // 버전 정보가 있는 경우 버전 메시지 추가
          if (item.systemChat.versionInfo && item.systemChat.versionInfo.newVersionId !== "1") {
            const versionId = item.systemChat.versionInfo.newVersionId || ""
            const description = item.systemChat.versionInfo.description || ""

            // 이미 추가된 버전인지 확인
            const versionExists = formattedMessages.some((msg) => msg.type === "version" && msg.versionInfo?.versionId === versionId)

            // 새로운 버전인 경우에만 버전 메시지 추가
            if (!versionExists) {
              formattedMessages.push({
                id: `version-${versionId}-${item.chatId}`,
                type: "version",
                message: description,
                timestamp: item.createdAt,
                versionInfo: {
                  versionId: versionId,
                  description: description,
                },
              })
            }
          }
        }
      })

      setMessages(formattedMessages)
    }
  }, [chatData])

  // 채팅 메시지 스크롤 처리
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, accumulatedText])

  // 컴포넌트 언마운트 시 SSE 연결 해제
  useEffect(() => {
    return () => {
      disconnectSSE()
    }
  }, [disconnectSSE])

  // 요청 태그 선택 핸들러
  const handleTagSelect = useCallback((tag: RequestTag) => {
    setSelectedTag(tag)
  }, [])

  // 요청 태그 해제 핸들러
  const handleTagClear = useCallback(() => {
    setSelectedTag("EXPLAIN") // 기본값으로 설정
  }, [])

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting) return

    setIsSubmitting(true)

    try {
      if (eventSourceRef.current) {
        disconnectSSE()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      retryCountRef.current = 0
      setCurrentMessageCompleted(false)
      setAccumulatedText("")
      setVersionInfo(null)
      setSSEError(null)
      setSending(true)
      setSendError(null)
      setShouldShowTempMessage(true)

      const sentMessage = newMessage
      setLastSentMessage(sentMessage)

      const targetMethods = targetNodes.length > 0 ? targetNodes.filter((target) => target.type === "method").map((target) => ({ methodId: target.id.replace("method-", "") })) : []

      const chatMessageData = {
        tag: selectedTag,
        promptType: "BODY",
        message: sentMessage,
        targetMethods,
      }

      setNewMessage("")

      const response = await axios.post<SSEIdResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData, {
        headers: {
          Authorization: token,
        },
      })

      if (response.data && response.data.streamId) {
        connectToSSE(response.data.streamId)
      } else {
        setSendError("SSE ID를 받지 못했습니다.")
      }
    } catch (err) {
      console.error("채팅 메시지 전송 오류:", err)

      if (axios.isAxiosError(err)) {
        setSendError(err.response?.data?.error || err.message)
      } else {
        setSendError("메시지 전송 중 오류가 발생했습니다.")
      }
    } finally {
      setSending(false)
      setTimeout(() => {
        setIsSubmitting(false)
      }, 500)
    }
  }, [newMessage, sending, sseConnected, isConnecting, isSubmitting, disconnectSSE, targetNodes, selectedTag, token, projectId, apiId, connectToSSE])

  // 버전 클릭 핸들러
  const handleVersionClick = useCallback(
    (versionId: string) => {
      if (onVersionSelect) {
        onVersionSelect(versionId)
      }
    },
    [onVersionSelect]
  )

  // 엔터 키 처리
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (!isSubmitting) {
          handleSendMessage()
        }
      }
    },
    [handleSendMessage, isSubmitting]
  )

  // 메시지 파싱 함수 - 코드 블록과 마크다운 형식 처리
  const parseMessage = useCallback((message: string) => {
    // 코드 블록 처리
    const codeBlockRegex = /```(java|javascript|typescript|html|css|python|json|xml|sql|bash|shell|cmd|yaml|markdown|text|jsx|tsx)?\s*([\s\S]*?)```/g
    let lastIndex = 0
    const parts: React.ReactNode[] = []
    let match

    while ((match = codeBlockRegex.exec(message)) !== null) {
      // 코드 블록 이전의 텍스트 추가
      if (match.index > lastIndex) {
        const textBeforeCode = message.substring(lastIndex, match.index)
        parts.push(parseMarkdown(textBeforeCode, `text-${match.index}`))
      }

      // 코드 블록 추가
      const language = match[1] || "text"
      const code = match[2]
      parts.push(
        <pre key={`code-${match.index}`} className="bg-gray-100 p-3 rounded-md overflow-x-auto my-2">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      )

      lastIndex = match.index + match[0].length
    }

    // 남은 텍스트 추가
    if (lastIndex < message.length) {
      parts.push(parseMarkdown(message.substring(lastIndex), `text-${lastIndex}`))
    }

    return parts.length > 0 ? parts : parseMarkdown(message, "text-full")
  }, [])

  // 마크다운 파싱 함수 - 볼드, 이탤릭, 링크, 제목, 글머리 기호 등 처리
  const parseMarkdown = useCallback((text: string, key: string) => {
    // 제목 처리 (# 제목, ## 제목, ### 제목)
    let parsedText = text
      // H1 제목 처리 (# 제목)
      .replace(/^#\s+(.*?)(?:\n|$)/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>')
      // H2 제목 처리 (## 제목)
      .replace(/^##\s+(.*?)(?:\n|$)/gm, '<h2 class="text-xl font-bold my-2">$1</h2>')
      // H3 제목 처리 (### 제목)
      .replace(/^###\s+(.*?)(?:\n|$)/gm, '<h3 class="text-lg font-bold my-2">$1</h3>')

    // 볼드 처리 (**텍스트** 또는 __텍스트__)
    parsedText = parsedText.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>")

    // 이탤릭 처리 (*텍스트* 또는 _텍스트_)
    parsedText = parsedText.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>")

    // 링크 처리 [텍스트](URL)
    parsedText = parsedText.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')

    // 글머리 기호 목록 처리 (- 항목)
    parsedText = parsedText.replace(/^-\s+(.*?)(?:\n|$)/gm, '<li class="flex items-start"><span class="inline-block w-2 h-2 rounded-full bg-gray-500 mt-1.5 mr-2"></span>$1</li>')

    // 연속된 목록 항목을 ul 태그로 감싸기
    parsedText = parsedText.replace(/<li.*?<\/li>(?:\s*<li.*?<\/li>)*/g, (match) => {
      return `<ul class="list-none pl-2 my-2">${match}</ul>`
    })

    // 줄바꿈 처리
    parsedText = parsedText.replace(/\n/g, "<br />")

    return <div key={key} dangerouslySetInnerHTML={{ __html: parsedText }} />
  }, [])

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
          <button onClick={() => onRefresh()} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-2">
            <RefreshCw size={16} />
            <span>다시 시도</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {/* 메시지 전송 오류 */}
      {(sendError || sseError) && (
        <div className="px-4 py-2 bg-red-50 text-red-600 border-b">
          <p className="text-sm">{sendError || sseError}</p>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {/* 기존 채팅 내역 */}
        {messages.length > 0 ? (
          messages.map((msg) => {
            if (msg.type === "user") {
              return (
                <div key={msg.id} className="flex flex-col items-end mb-4">
                  <div className="bg-green-50 text-blue-900 rounded-lg py-2 px-4 max-w-[80%]">
                    {/* 요청 태그 표시 */}
                    {msg.tag && (
                      <div className="mb-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">{msg.tag}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              )
            } else if (msg.type === "system") {
              return (
                <div key={msg.id} className="flex flex-col mb-2">
                  {/* 시스템 메시지를 좌우 가득 차지하게 변경하고 배경색을 흰색으로 */}
                  <div className="bg-white  rounded-lg py-3 px-4 w-full ">
                    <div className="prose max-w-none">{parseMessage(msg.message)}</div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 self-start">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              )
            } else if (msg.type === "version" && msg.versionInfo) {
              // 버전 메시지 표시
              return (
                <div key={msg.id} className="my-2">
                  <button
                    onClick={() => handleVersionClick(msg.versionInfo!.versionId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      versionId === msg.versionInfo!.versionId ? "bg-blue-500 text-white" : "border border-blue-500 bg-blue-50 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    <Clock size={16} />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">VERSION {msg.versionInfo.versionId}</span>
                      <span className="text-xs">{msg.versionInfo.description}</span>
                    </div>
                  </button>
                  <hr className="mb-4 mt-2" />
                </div>
              )
            }
            return null
          })
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">��팅 내역이 없습니다.</div>
        )}

        {/* 현재 SSE 메시지 표시 - 누적 텍스트 사용 */}
        {shouldShowTempMessage && (sseConnected || isConnecting || accumulatedText) && (
          <div className="mb-4">
            {/* 사용자 메시지 (가장 최근에 보낸 메시지) */}
            <div className="flex justify-end mb-4">
              <div className="max-w-[80%] p-3 rounded-lg bg-blue-500 text-white rounded-tr-none">
                {/* 요청 태그 표시 */}
                <div className="mb-1">
                  <span className="inline-block px-2 py-0.5 bg-blue-400 text-white rounded-full text-xs">{selectedTag}</span>
                </div>
                <div>{lastSentMessage}</div>
              </div>
            </div>

            {/* SSE 응답 메시지 - 좌우 가득 차지하게 변경하고 배경색을 흰색으로 */}
            <div className="flex flex-col mb-4">
              <div className="w-full bg-white ">
                <div className="prose max-w-none">
                  {parseMessage(accumulatedText)}
                  {(sseConnected || isConnecting) && <span className="inline-block ml-1 w-2 h-4 bg-gray-500 animate-pulse"></span>}
                </div>
                {(sseConnected || isConnecting) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
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
      </div>

      {/* 요청 태그 선택 영역 */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="text-xs font-medium text-gray-700 flex items-center">
            <span className="mr-1">요청 유형:</span>
            <div className="relative group">
              <Info size={14} className="text-gray-500" />
              <div className="absolute bottom-full left-0 mb-1 p-2 bg-white rounded shadow-md text-xs w-64 hidden group-hover:block z-10">
                <p className="mb-1">
                  <strong>설명(EXPLAIN):</strong> 코드나 개념에 대한 설명을 요청합니다.
                </p>
                <p className="mb-1">
                  <strong>리팩토링(REFACTORING):</strong> 코드 구조 개선을 요청합니다.
                </p>
                <p className="mb-1">
                  <strong>최적화(OPTIMIZE):</strong> 성능 향상을 위한 코드 최적화를 요청합니다.
                </p>
                <p>
                  <strong>구현(IMPLEMENT):</strong> 새로운 기능 구현을 요청합니다.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTagSelect("EXPLAIN")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTag === "EXPLAIN" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              disabled={selectedTag === "EXPLAIN" && sending}
            >
              설명
            </button>
            <button
              onClick={() => handleTagSelect("REFACTORING")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTag === "REFACTORING" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              disabled={selectedTag === "REFACTORING" && sending}
            >
              리팩토링
            </button>
            <button
              onClick={() => handleTagSelect("OPTIMIZE")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTag === "OPTIMIZE" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              disabled={selectedTag === "OPTIMIZE" && sending}
            >
              최적화
            </button>
            <button
              onClick={() => handleTagSelect("IMPLEMENT")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedTag === "IMPLEMENT" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              disabled={selectedTag === "IMPLEMENT" && sending}
            >
              구현
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-3 border-t">
        <div className="flex flex-col gap-2">
          {/* 선택된 요청 태그 표시 */}
          <div className="flex items-center gap-1">
            <div className="text-xs text-gray-700">선택된 요청:</div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              <span>{selectedTag}</span>
              <button onClick={handleTagClear} className="ml-1 p-0.5 rounded-full bg-blue-200 hover:bg-blue-300 transition-colors" aria-label="요청 태그 해제">
                <X size={10} className="text-blue-700" />
              </button>
            </div>
          </div>

          {/* 메시지 입력 필드 */}
          <div className="flex items-center gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sseConnected || isConnecting ? "처리 중입니다..." : "메시지를 입력하세요..."}
              className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={sending || sseConnected || isConnecting}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting}
              className={`p-3 rounded-full ${
                sending || !newMessage.trim() || sseConnected || isConnecting || isSubmitting ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {sending || isConnecting ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Send size={20} />}
            </button>
          </div>
        </div>

        {(sseConnected || isConnecting) && (
          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
            <AlertCircle size={12} />
            <span>AI가 응답을 생성하는 중입니다. 잠시만 기다려주세요.</span>
          </div>
        )}
      </div>
    </div>
  )
}
