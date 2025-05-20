"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, Send, RefreshCw, X, Info } from "lucide-react"
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
  token?: string | { newVersionId?: string }
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

  // 최신 버전을 추적하기 위한 참조 변수 추가 (useState 선언 아래에 추가)
  const latestVersionIdRef = useRef<string | null>(null)
  console.log(versionInfo)
  // 환경 감지 및 디버깅 설정
  const [isProd, setIsProd] = useState<boolean>(false)
  const [debugMode, setDebugMode] = useState<boolean>(true)

  // 참조 변수
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeSSEIdRef = useRef<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { token } = useAuthStore()

  // 환경 감지 로직
  useEffect(() => {
    // 배포 환경 감지 (URL 기반)
    const isProduction = !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")
    setIsProd(isProduction)

    console.log(`🌍 실행 환경: ${isProduction ? "배포" : "로컬"}`)

    // 디버깅 모드 설정 (URL 파라미터로 제어 가능)
    const urlParams = new URLSearchParams(window.location.search)
    const debugParam = urlParams.get("debug")
    const shouldDebug = debugParam === "true" || !isProduction

    setDebugMode(shouldDebug)
    console.log(`🔍 디버깅 모드: ${shouldDebug ? "활성화" : "비활성화"}`)

    // 브라우저 정보 로깅
    console.log("🌐 브라우저 정보:", {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
    })
  }, [])

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

  const handleSSEMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // 원본 이벤트 데이터 로깅 (항상 기록)
        console.log("🔍 SSE 원본 데이터:", event.data)

        if (currentMessageCompleted && !activeSSEIdRef.current) {
          console.log("⚠️ 메시지가 이미 완료되었거나 활성 SSE ID가 없습니다.")
          return
        }

        let parsedData: SSEResponse | null = null
        let parsingMethod = ""

        // 다양한 형식의 파싱 시도
        try {
          // 1. 'event:message\ndata:{"token": {"newVersionId": "2"}}' 형식 처리
          if (event.data.includes("event:message") && event.data.includes("data:")) {
            const dataMatch = event.data.match(/data:(.*)/)
            if (dataMatch && dataMatch[1]) {
              parsedData = JSON.parse(dataMatch[1].trim())
              parsingMethod = "event:message 형식"
            }
          }
          // 2. 일반 JSON 파싱 시도
          else {
            parsedData = JSON.parse(event.data)
            parsingMethod = "일반 JSON"
          }
        } catch (parseError) {
          console.log("⚠️ 첫 번째 파싱 시도 실패:", parseError)

          // 3. data: 접두사 처리
          if (event.data.startsWith("data:")) {
            try {
              const jsonStr = event.data.substring(5).trim()
              console.log("🔍 data: 접두사 제거 후:", jsonStr)
              parsedData = JSON.parse(jsonStr)
              parsingMethod = "data: 접두사"
            } catch (dataError) {
              console.log("⚠️ data: 접두사 파싱 실패:", dataError)
              parsedData = { text: event.data }
              parsingMethod = "텍스트 폴백"
            }
          } else {
            // 4. 마지막 수단: 원본 텍스트 사용
            parsedData = { text: event.data }
            parsingMethod = "텍스트 폴백"
          }
        }

        // 파싱 결과 로깅
        console.log(`✅ 파싱 성공 (${parsingMethod}):`, parsedData)

        if (parsedData && parsedData.error) {
          console.error("❌ SSE 에러 응답:", parsedData.error)
          setSSEError(parsedData.error)
          return
        }

        // token이 객체인 경우 newVersionId 확인
        if (parsedData && parsedData.token && typeof parsedData.token === "object") {
          const tokenObj = parsedData.token as { newVersionId?: string }
          if (tokenObj.newVersionId) {
            console.log("🔄 새 버전 ID 감지:", tokenObj.newVersionId)

            // 현재 버전이 더 높은 경우에만 업데이트
            const newVersionNum = Number.parseInt(tokenObj.newVersionId, 10)
            const currentVersionNum = latestVersionIdRef.current ? Number.parseInt(latestVersionIdRef.current, 10) : 0

            console.log("🔄 버전 비교:", { 새버전: newVersionNum, 현재버전: currentVersionNum })

            if (newVersionNum > currentVersionNum) {
              console.log(`✅ 버전 업데이트: ${currentVersionNum} -> ${newVersionNum}`)

              // 최신 버전 ID 업데이트
              latestVersionIdRef.current = tokenObj.newVersionId

              // 새 버전 정보 저장
              const newVersionInfo = {
                newVersionId: tokenObj.newVersionId,
                description: "새 버전",
              }
              setVersionInfo(newVersionInfo)

              // 즉시 URL 업데이트 및 다이어그램 요청
              if (onNewVersionInfo) {
                console.log("📤 새 버전 정보 전달:", newVersionInfo)
                onNewVersionInfo(newVersionInfo)
              }

              // URL 직접 업데이트 (필요한 경우)
              if (projectId && apiId) {
                const newUrl = `/canvas/${projectId}/${apiId}?version=${tokenObj.newVersionId}`
                console.log("🔄 URL 업데이트:", newUrl)

                // 현재 URL과 다른 경우에만 업데이트
                if (window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) && !window.location.search.includes(`version=${tokenObj.newVersionId}`)) {
                  window.history.pushState({}, "", newUrl)
                }
              }
            } else {
              console.log(`⚠️ 무시된 버전 업데이트: 현재 ${currentVersionNum}, 수신 ${newVersionNum}`)
            }

            // 텍스트 표시를 위해 객체를 문자열로 변환
            try {
              const tokenStr = JSON.stringify(parsedData.token)
              console.log("📝 토큰 문자열 변환:", tokenStr)
              setAccumulatedText((prev) => {
                const newText = prev + tokenStr
                console.log("📝 누적 텍스트 업데이트:", newText)
                return newText
              })
            } catch (e) {
              console.error("❌ 토큰 객체 변환 오류:", e)
            }
          }
        }
        // token이 문자열인 경우 기존 처리 유지
        else if (parsedData && parsedData.token && typeof parsedData.token === "string") {
          console.log("📝 문자열 토큰 수신:", parsedData.token)
          setAccumulatedText((prev) => {
            const newText = (prev + parsedData!.token) as string
            console.log("📝 누적 텍스트 업데이트:", newText)
            return newText
          })
        }

        // 디버깅 메시지에서 토큰 추출
        if (parsedData && parsedData.text) {
          console.log("📝 텍스트 필드 확인:", parsedData.text)
          const tokenMatch = String(parsedData.text).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            console.log("🔍 디버깅 토큰 추출:", token)
            setAccumulatedText((prev) => {
              const newText = prev + token
              console.log("📝 누적 텍스트 업데이트:", newText)
              return newText
            })
          }
        }

        // chunk 필드 확인
        if (parsedData && parsedData.chunk) {
          console.log("📝 청크 필드 확인:", parsedData.chunk)
          const tokenMatch = String(parsedData.chunk).match(/\[디버깅\] 새 토큰 수신: (.*)/)
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1].trim()
            console.log("🔍 디버깅 청크 추출:", token)
            setAccumulatedText((prev) => {
              const newText = prev + token
              console.log("📝 누적 텍스트 업데이트:", newText)
              return newText
            })
          }
        }

        // versionInfo 필드 확인
        if (parsedData && parsedData.versionInfo) {
          console.log("🔄 SSE에서 새 버전 정보 감지:", parsedData.versionInfo)

          // 현재 버전이 더 높은 경우에만 업데이트
          const newVersionNum = Number.parseInt(parsedData.versionInfo.newVersionId, 10)
          const currentVersionNum = latestVersionIdRef.current ? Number.parseInt(latestVersionIdRef.current, 10) : 0

          console.log("🔄 버전 비교:", { 새버전: newVersionNum, 현재버전: currentVersionNum })

          if (newVersionNum > currentVersionNum) {
            console.log(`✅ 버전 업데이트: ${currentVersionNum} -> ${newVersionNum}`)

            // 최신 버전 ID 업데이트
            latestVersionIdRef.current = parsedData.versionInfo.newVersionId

            // 버전 정보 저장
            setVersionInfo(parsedData.versionInfo)

            // 새 버전 정보 즉시 전달 및 URL 업데이트
            if (onNewVersionInfo) {
              console.log("📤 부모 컴포넌트에 새 버전 정보 전달:", parsedData.versionInfo)
              onNewVersionInfo(parsedData.versionInfo)
            }

            // URL 직접 업데이트 (필요한 경우)
            if (projectId && apiId && parsedData.versionInfo.newVersionId) {
              const newUrl = `/canvas/${projectId}/${apiId}?version=${parsedData.versionInfo.newVersionId}`
              console.log("🔄 URL 업데이트:", newUrl)

              // 현재 URL과 다른 경우에만 업데이트
              if (window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) && !window.location.search.includes(`version=${parsedData.versionInfo.newVersionId}`)) {
                window.history.pushState({}, "", newUrl)
              }
            }
          } else {
            console.log(`⚠️ 무시된 버전 업데이트: 현재 ${currentVersionNum}, 수신 ${newVersionNum}`)
          }
        }

        // 완료 메시지 확인
        const isCompleted =
          (parsedData && parsedData.status === "COMPLETED") ||
          (parsedData && parsedData.message && (parsedData.message.includes("완료") || parsedData.message.includes("SSE 연결이 종료") || parsedData.message.includes("종료"))) ||
          (parsedData && parsedData.token && typeof parsedData.token === "string" && parsedData.token.includes("완료")) ||
          (parsedData && parsedData.done === true)

        if (isCompleted) {
          console.log("✅ SSE 완료 메시지 감지:", {
            status: parsedData?.status,
            message: parsedData?.message,
            done: parsedData?.done,
          })

          setCurrentMessageCompleted(true)
          disconnectSSE()

          // 저장된 최신 버전 정보가 있으면 SSE 완료 후 다시 한번 확인
          if (latestVersionIdRef.current && onNewVersionInfo) {
            const finalVersionInfo = {
              newVersionId: latestVersionIdRef.current,
              description: "최종 버전",
            }

            console.log("📤 SSE 완료 후 최종 버전 정보 확인:", finalVersionInfo)
            onNewVersionInfo(finalVersionInfo)

            // URL 직접 업데이트 (필요한 경우)
            if (projectId && apiId) {
              const newUrl = `/canvas/${projectId}/${apiId}?version=${latestVersionIdRef.current}`
              console.log("🔄 SSE 완료 후 최종 URL 업데이트:", newUrl)

              // 현재 URL과 다른 경우에만 업데이트
              if (window.location.pathname.includes(`/canvas/${projectId}/${apiId}`) && !window.location.search.includes(`version=${latestVersionIdRef.current}`)) {
                window.history.pushState({}, "", newUrl)
              }
            }
          }

          setTimeout(() => {
            console.log("🔄 채팅 내역 새로고침 시작")
            onRefresh().then(() => {
              // 채팅 내역 새로고침 후 임시 메시지 상태 초기화
              console.log("✅ 채팅 내역 새로고침 완료, 상태 초기화")
              setShouldShowTempMessage(false)
              setAccumulatedText("")
              setLastSentMessage("")
            })
            setCurrentMessageCompleted(false)
          }, 500)
        }
      } catch (err) {
        console.error("❌ SSE 메시지 처리 오류:", err)
      }
    },
    [currentMessageCompleted, disconnectSSE, onRefresh, onNewVersionInfo, projectId, apiId]
  )

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

  const connectToSSE = useCallback(
    (sseId: string) => {
      console.log("🔌 SSE 연결 시도:", sseId)

      if (sseId !== activeSSEIdRef.current) {
        console.log("🔄 새로운 SSE ID 감지, 메시지 완료 상태 초기화")
        setCurrentMessageCompleted(false)
      } else if (currentMessageCompleted) {
        console.log("⚠️ 메시지가 이미 완료됨, 연결 중단")
        return
      }

      if (isConnecting && eventSourceRef.current) {
        console.log("⚠️ 이미 연결 중, 중복 연결 방지")
        return
      }

      console.log("🔌 기존 SSE 연결 해제")
      disconnectSSE()

      activeSSEIdRef.current = sseId
      setIsConnecting(true)
      setCurrentSSEId(sseId)
      setSSEError(null)
      setShouldShowTempMessage(true)

      try {
        console.log("🔌 새 EventSource 생성:", `/api/sse/connect/${sseId}`)
        const eventSource = new EventSource(`/api/sse/connect/${sseId}`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log("✅ SSE 연결 성공")
          setSSEConnected(true)
          setSSEError(null)
          setIsConnecting(false)
          retryCountRef.current = 0
        }

        eventSource.onmessage = (event) => {
          console.log("📥 SSE 메시지 수신")
          handleSSEMessage(event)
        }

        eventSource.onerror = (err) => {
          console.error("❌ SSE 연결 오류:", err)
          handleSSEError(err)
        }
      } catch (err) {
        console.error("❌ SSE 연결 설정 오류:", err)
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

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting) {
      console.log("⚠️ 메시지 전송 불가:", {
        메시지비어있음: !newMessage.trim(),
        전송중: sending,
        SSE연결됨: sseConnected,
        연결중: isConnecting,
        제출중: isSubmitting,
      })
      return
    }

    console.log("🚀 메시지 전송 시작")
    setIsSubmitting(true)

    try {
      if (eventSourceRef.current) {
        console.log("🔌 기존 SSE 연결 해제")
        disconnectSSE()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      retryCountRef.current = 0
      setCurrentMessageCompleted(false)
      setAccumulatedText("")
      setVersionInfo(null) // 새 메시지 전송 시 버전 정보 초기화
      latestVersionIdRef.current = null // 최신 버전 ID 참조 초기화
      setSSEError(null)
      setSending(true)
      setSendError(null)
      setShouldShowTempMessage(true)

      const sentMessage = newMessage
      setLastSentMessage(sentMessage)
      console.log("📝 전송할 메시지:", sentMessage)

      const targetMethods = targetNodes.length > 0 ? targetNodes.filter((target) => target.type === "method").map((target) => ({ methodId: target.id.replace("method-", "") })) : []

      console.log("🎯 대상 메서드:", targetMethods)

      const chatMessageData = {
        tag: selectedTag,
        promptType: "BODY",
        message: sentMessage,
        targetMethods,
      }

      console.log("📤 API 요청 데이터:", chatMessageData)
      setNewMessage("")

      console.log(`📤 POST 요청: /api/chat/${projectId}/${apiId}`)
      const response = await axios.post<SSEIdResponse>(`/api/chat/${projectId}/${apiId}`, chatMessageData, {
        headers: {
          Authorization: token,
        },
      })

      console.log("📥 API 응답:", response.data)

      if (response.data && response.data.streamId) {
        console.log("✅ SSE ID 수신:", response.data.streamId)
        connectToSSE(response.data.streamId)
      } else {
        console.error("❌ SSE ID 없음")
        setSendError("SSE ID를 받지 못했습니다.")
      }
    } catch (err) {
      console.error("❌ 채팅 메시지 전송 오류:", err)

      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.message
        console.error("❌ Axios 오류:", errorMessage)
        setSendError(errorMessage)
      } else {
        setSendError("메시지 전송 중 오류가 발생했습니다.")
      }
    } finally {
      setSending(false)
      setTimeout(() => {
        setIsSubmitting(false)
        console.log("✅ 메시지 전송 프로세스 완료")
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
      // H4 제목 처리 (#### 제목)
      .replace(/^####\s+(.*?)(?:\n|$)/gm, '<h4 class="text-lg font-bold my-2">$1</h4>')
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

  // 디버깅 UI 렌더링
  const renderDebugInfo = () => {
    if (!debugMode) return null

    return (
      <div className="px-4 py-2 bg-yellow-50 text-yellow-800 border-b text-xs">
        <details>
          <summary className="font-semibold cursor-pointer">디버깅 정보 (클릭하여 {isProd ? "배포" : "로컬"} 환경)</summary>
          <div className="mt-2 space-y-1">
            <div>SSE 상태: {sseConnected ? "연결됨" : isConnecting ? "연결 중" : "연결 안됨"}</div>
            <div>SSE ID: {currentSSEId || "없음"}</div>
            <div>최신 버전 ID: {latestVersionIdRef.current || "없음"}</div>
            <div>메시지 완료: {currentMessageCompleted ? "예" : "아니오"}</div>
            <div>
              재시도 횟수: {retryCountRef.current}/{maxRetries}
            </div>
            <div>
              <button
                onClick={() => {
                  console.clear()
                  console.log("🧹 콘솔 로그 초기화됨")
                }}
                className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                콘솔 로그 지우기
              </button>
            </div>
          </div>
        </details>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow overflow-hidden">
      {renderDebugInfo()}

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
                  <div className="bg-blue-50 text-blue-900 rounded-lg py-2 px-4 max-w-[80%]">
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
                  <div className="bg-white rounded-lg py-3 px-4 w-full">
                    <div className="prose max-w-none">{parseMessage(msg.message)}</div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 self-start">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              )
            } else if (msg.type === "version" && msg.versionInfo) {
              // 버전 메시지 표시 - 여기서 버튼 스타일 업데이트
              return (
                <div key={msg.id} className="my-2">
                  <button
                    onClick={() => handleVersionClick(msg.versionInfo!.versionId)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      versionId === msg.versionInfo!.versionId ? "bg-gray-700 text-white shadow-sm" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Clock size={14} />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">VERSION {msg.versionInfo.versionId}</span>
                      <span className="text-xs opacity-90">{msg.versionInfo.description}</span>
                    </div>
                  </button>
                  <hr className="mb-4 mt-2" />
                </div>
              )
            }
            return null
          })
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">채팅 내역이 없습니다.</div>
        )}

        {/* 현재 SSE 메시지 표시 - 누적 텍스트 사용 */}
        {shouldShowTempMessage && (sseConnected || isConnecting || accumulatedText) && (
          <div className="mb-4">
            {/* 사용자 메시지 (가장 최근에 보낸 메시지) */}
            <div className="flex justify-end mb-4">
              <div className="max-w-[80%] p-3 rounded-lg bg-blue-50 text-blue-900 rounded-tr-none">
                {/* 요청 태그 표시 */}
                <div className="mb-1">
                  <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">{selectedTag}</span>
                </div>
                <div>{lastSentMessage}</div>
              </div>
            </div>

            {/* SSE 응답 메시지 - 좌우 가득 차지하게 변경하고 배경색을 흰색으로 */}
            <div className="flex flex-col mb-4">
              <div className="w-full bg-white">
                <div className="prose max-w-none">
                  {parseMessage(accumulatedText)}
                  {(sseConnected || isConnecting) && <span className="inline-block ml-1 w-2 h-4 bg-gray-500 animate-pulse"></span>}
                </div>
                {(sseConnected || isConnecting) && (
                  <div className="mt-2 flex items-center gap-0.5 text-xs">
                    {"SCRUD".split("").map((letter, index) => (
                      <span
                        key={`scrud-${index}`}
                        className="font-semibold transition-opacity duration-700 ease-in-out"
                        style={{
                          animation: `pulse 1.5s infinite ${index * 0.3}s`,
                          color: "#3b82f6",
                        }}
                      >
                        {letter}
                      </span>
                    ))}
                    <style jsx>{`
                      @keyframes pulse {
                        0%,
                        100% {
                          opacity: 0.3;
                        }
                        50% {
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 타임스탬프 */}
        {shouldShowTempMessage && (sseConnected || isConnecting || accumulatedText) && (
          <div className="text-center mt-1 mb-4">
            <span className="text-xs text-gray-400">{new Date().toLocaleString()}</span>
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
            {/* 태그 선택 버튼 - 심플한 디자인으로 업데이트 */}
            <button
              onClick={() => handleTagSelect("EXPLAIN")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedTag === "EXPLAIN" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
              disabled={selectedTag === "EXPLAIN" && sending}
            >
              설명
            </button>
            <button
              onClick={() => handleTagSelect("REFACTORING")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                selectedTag === "REFACTORING" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
              disabled={selectedTag === "REFACTORING" && sending}
            >
              리팩토링
            </button>
            <button
              onClick={() => handleTagSelect("OPTIMIZE")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedTag === "OPTIMIZE" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
              disabled={selectedTag === "OPTIMIZE" && sending}
            >
              최적화
            </button>
            <button
              onClick={() => handleTagSelect("IMPLEMENT")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedTag === "IMPLEMENT" ? "bg-gray-700 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
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
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-md text-xs">
              <span>{selectedTag}</span>
              <button onClick={handleTagClear} className="ml-1 p-0.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors" aria-label="요청 태그 해제">
                <X size={10} />
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
              className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              rows={2}
              disabled={sending || sseConnected || isConnecting}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || sseConnected || isConnecting || isSubmitting}
              className={`p-2.5 rounded-md ${
                sending || !newMessage.trim() || sseConnected || isConnecting || isSubmitting ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-700 text-white hover:bg-gray-800"
              }`}
            >
              {sending || isConnecting ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div> : <Send size={18} />}
            </button>
          </div>
        </div>

        {(sseConnected || isConnecting) && (
          <div className="mt-2 flex items-center gap-1">
            {"SCRUD".split("").map((letter, index) => (
              <span
                key={`scrud-${index}`}
                className="font-semibold transition-opacity duration-700 ease-in-out"
                style={{
                  animation: `pulse 1.5s infinite ${index * 0.3}s`,
                  color: "#3b82f6",
                }}
              >
                {letter}
              </span>
            ))}
            <style jsx>{`
              @keyframes pulse {
                0%,
                100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  )
}
