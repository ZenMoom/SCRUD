"use client"

import { useState, useEffect } from "react"
import type React from "react"

interface ApiHeaderProps {
  scrudProjectId: number
  apiSpecVersionId: number | null
  isLoading: boolean
  isCreatingDiagram?: boolean
  diagramCreationProgress?: number
  diagramCreationStep?: string
  apiStatus?: string
  handleSaveApi: () => Promise<void>
  handleDeleteApi: () => Promise<void>
  handleTestApi: () => Promise<void>
  handleCreateDiagram?: () => Promise<void>
  handleCancelDiagramCreation?: () => void
}

const ApiHeader: React.FC<ApiHeaderProps> = ({
  scrudProjectId,
  apiSpecVersionId,
  isLoading,
  isCreatingDiagram = false,
  diagramCreationProgress = 0,
  diagramCreationStep = "",
  apiStatus = "AI_GENERATED",
  handleSaveApi,
  handleDeleteApi,
  handleTestApi,
  handleCreateDiagram,
  handleCancelDiagramCreation,
}) => {
  // 다이어그램 생성 시작 시간 추적
  const [creationStartTime, setCreationStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // 다이어그램 생성 시작/종료 시 타이머 설정
  useEffect(() => {
    if (isCreatingDiagram && !creationStartTime) {
      setCreationStartTime(Date.now())
    } else if (!isCreatingDiagram) {
      setCreationStartTime(null)
      setElapsedTime(0)
    }
  }, [isCreatingDiagram, creationStartTime])

  // 경과 시간 업데이트
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (isCreatingDiagram && creationStartTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - creationStartTime) / 1000))
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isCreatingDiagram, creationStartTime])

  // 경과 시간을 mm:ss 형식으로 포맷팅
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // API 상태에 따라 도식화 버튼 표시 여부 결정
  const showDiagramButton = apiStatus === "AI_GENERATED" && apiSpecVersionId !== null

  // 도식화 보기 버튼 클릭 핸들러 - router.push 대신 window.location.href 사용
  const handleViewDiagram = () => {
    if (!apiSpecVersionId) return

    // 버전 정보를 포함하여 URL 구성 (version=1 추가)
    window.location.href = `/canvas/${scrudProjectId}/${apiSpecVersionId}`
  }

  return (
    <div className="p-3 border-b bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-4">API 편집기</h2>
          {/* 프로젝트 ID 표시 - 편집 불가능한 형태로 */}
          <div className="px-3 py-1 bg-gray-100 rounded-md text-sm">
            <span className="text-gray-500">프로젝트 ID:</span> <span className="font-medium text-gray-800">{scrudProjectId}</span>
          </div>

          {/* API 상태 표시 */}
          {apiSpecVersionId && apiStatus !== "AI_VISUALIZED" && (
            <div className={`ml-2 px-3 py-1 rounded-md text-sm ${apiStatus === "AI_GENERATED" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
              {apiStatus === "AI_GENERATED" ? "AI 생성됨" : "사용자 완료"}
            </div>
          )}

          {/* 도식화 보기 버튼 - API 상태가 AI_VISUALIZED일 때만 표시 */}
          {apiSpecVersionId && apiStatus === "AI_VISUALIZED" && (
            <button onClick={handleViewDiagram} className="ml-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              도식화 보기
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {/* 도식화 진행 버튼 추가 */}
          {showDiagramButton && handleCreateDiagram && (
            <button
              onClick={handleCreateDiagram}
              disabled={isLoading || isCreatingDiagram}
              className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm font-medium flex items-center"
            >
              {isCreatingDiagram ? (
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              )}
              도식화 진행
            </button>
          )}

          <button
            onClick={handleSaveApi}
            disabled={isLoading || isCreatingDiagram}
            className={`px-3 py-1.5 rounded text-white text-sm font-medium disabled:opacity-50 flex items-center ${
              apiSpecVersionId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? (
              <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                {apiSpecVersionId ? (
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                )}
              </svg>
            )}
            {apiSpecVersionId ? "수정하기" : "생성하기"}
          </button>

          {apiSpecVersionId && (
            <button
              onClick={handleDeleteApi}
              disabled={isLoading || isCreatingDiagram}
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              삭제하기
            </button>
          )}

          <button
            onClick={handleTestApi}
            disabled={isLoading || isCreatingDiagram}
            className="px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            테스트하기
          </button>
        </div>
      </div>

      {/* 다이어그램 생성 진행 상태 표시 */}
      {isCreatingDiagram && (
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3 relative">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2"></span>
              <h3 className="font-medium text-blue-800">다이어그램 생성 중...</h3>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-blue-600 mr-3">경과 시간: {formatElapsedTime(elapsedTime)}</span>
              {handleCancelDiagramCreation && (
                <button onClick={handleCancelDiagramCreation} className="px-2 py-1 bg-white text-red-600 border border-red-300 rounded text-xs hover:bg-red-50">
                  취소
                </button>
              )}
            </div>
          </div>

          {/* 진행 단계 표시 */}
          {diagramCreationStep && <div className="text-sm text-blue-700 mb-2">{diagramCreationStep}</div>}

          {/* 진행률 표시 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" style={{ width: `${diagramCreationProgress}%` }}></div>
          </div>

          <div className="text-xs text-right text-blue-600">{diagramCreationProgress}% 완료</div>
        </div>
      )}
    </div>
  )
}

export default ApiHeader
