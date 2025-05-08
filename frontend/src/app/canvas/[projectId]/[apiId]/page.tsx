// src/app/canvas/[projectId]/[apiId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { DiagramResponse } from "@generated/model" // 다이어그램 타입 임포트
import { ChatHistoryResponse } from "@generated/model"

// 컴포넌트 임포트
import ChatContainer from "@/components/canvas/ChatContainer"
import DiagramContainer from "@/components/canvas/DiagramContainer"
import DtoContainer from "@/components/canvas/DtoContainer"

export default function CanvasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터 가져오기
  const params = useParams()
  const { projectId, apiId, versionId: pathVersionId } = params

  // 쿼리 파라미터에서 버전 ID 가져오기 또는, URL 경로에서 가져온 버전 ID 사용
  const queryVersionId = searchParams.get("version")
  const currentVersionId = queryVersionId || (pathVersionId as string)

  // 다이어그램 데이터 상태
  const [diagramData, setDiagramData] = useState<DiagramResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 채팅 데이터 상태 추가
  const [chatData, setChatData] = useState<ChatHistoryResponse | null>(null)
  const [chatLoading, setChatLoading] = useState<boolean>(true)
  const [chatError, setChatError] = useState<string | null>(null)

  // 페이지 로드 시 다이어그램 데이터와 채팅 데이터 모두 가져오기
  useEffect(() => {
    fetchDiagramData()
    fetchChatData() // 채팅 데이터 가져오기 추가
  }, [projectId, apiId, currentVersionId])

  // 다이어그램 데이터 가져오기 함수
  const fetchDiagramData = async () => {
    try {
      setLoading(true)
      setError(null)

      // axios를 사용하여 API 호출
      const response = await axios.get<DiagramResponse>(`/api/canvas/${projectId}/${apiId}/${currentVersionId}`)

      setDiagramData(response.data)
      console.log("다이어그램 데이터:", response.data)
    } catch (err) {
      console.error("다이어그램 데이터 가져오기 오류:", err)

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message)
      } else {
        setError("알 수 없는 오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  // 채팅 데이터 가져오기 함수 추가
  const fetchChatData = async () => {
    try {
      setChatLoading(true)
      setChatError(null)

      // axios를 사용하여 채팅 API 호출
      const response = await axios.get<ChatHistoryResponse>(`/api/chat/${projectId}/${apiId}`)

      setChatData(response.data)
      console.log("채팅 데이터:", response.data)
    } catch (err) {
      console.error("채팅 데이터 가져오기 오류:", err)

      if (axios.isAxiosError(err)) {
        setChatError(err.response?.data?.error || err.message)
      } else {
        setChatError("채팅 데이터를 가져오는 중 오류가 발생했습니다.")
      }
    } finally {
      setChatLoading(false)
    }
  }

  // 모든 데이터를 새로고침하는 함수
  const refreshAllData = () => {
    fetchDiagramData()
    fetchChatData()
  }

  // 버전 이동 처리 함수
  const handleVersionMove = () => {
    // 현재 버전을 숫자로 변환
    const currentVersion = parseInt(currentVersionId, 10)

    // 다음 버전 계산
    const nextVersion = currentVersion + 1

    // URL 업데이트 (새로고침 없이)
    router.replace(`/canvas/${projectId}/${apiId}?version=${nextVersion}`, {
      scroll: false, // 스크롤 위치 유지
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">다이어그램 캔버스</h1>

          <div className="flex items-center gap-2">
            {/* 현재 버전 표시 */}
            <span className="text-gray-600">현재 버전: {currentVersionId}</span>

            {/* 버전 이동 버튼 */}
            <button onClick={handleVersionMove} className="px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 transition-colors" disabled={loading || chatLoading}>
              버전 이동
            </button>
          </div>
        </div>

        {/* 새로고침 버튼 - 모든 데이터 새로고침 */}
        <div className="mb-4">
          <button onClick={refreshAllData} className="px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors" disabled={loading || chatLoading}>
            {loading || chatLoading ? "로딩 중..." : "데이터 새로고침"}
          </button>
        </div>

        {/* 3단 레이아웃 - 비율 20:60:20 */}
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)] overflow-hidden">
          {/* 왼쪽 섹션 (비율 20%) - 채팅 데이터 전달 */}
          <div className="w-full md:w-1/5 min-w-0">
            <ChatContainer
              projectId={projectId as string}
              apiId={apiId as string}
              versionId={currentVersionId}
              chatData={chatData}
              loading={chatLoading}
              error={chatError}
              onRefresh={fetchChatData} // 채팅 데이터만 새로고침하는 함수 전달
            />
          </div>

          {/* 중앙 섹션 (비율 60%) */}
          <div className="w-full md:w-3/5 min-w-0">
            <DiagramContainer diagramData={diagramData} loading={loading} error={error} />
          </div>

          {/* 오른쪽 섹션 (비율 20%) */}
          <div className="w-full md:w-1/5 min-w-0">
            <DtoContainer diagramData={diagramData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
