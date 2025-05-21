"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Check, X } from "lucide-react"

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
  handleCreateDiagram,
  handleCancelDiagramCreation,
}) => {
  // 다이어그램 생성 시작 시간 추적
  const [creationStartTime, setCreationStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [displayProgress, setDisplayProgress] = useState<number>(0)
  const [showCompletionAlert, setShowCompletionAlert] = useState<boolean>(false)
  const previousIsCreatingRef = useRef<boolean>(false)

  // 기본 alert 방지를 위한 window.alert 오버라이드
  useEffect(() => {
    // 원래의 alert 함수 저장
    const originalAlert = window.alert

    // alert 함수 오버라이드
    window.alert = (message) => {
      // 다이어그램 완료 관련 메시지인 경우 무시 (필요에 따라 메시지 내용 확인)
      if (message && typeof message === "string" && (message.includes("완료") || message.includes("성공") || message.includes("도식화") || message.includes("diagram"))) {
        return
      }

      // 그 외의 경우 원래 alert 실행
      originalAlert.call(window, message)
    }

    // 컴포넌트 언마운트 시 원래 함수로 복원
    return () => {
      window.alert = originalAlert
    }
  }, [])

  // 다이어그램 생성 시작/종료 시 타이머 설정
  useEffect(() => {
    if (isCreatingDiagram && !creationStartTime) {
      setCreationStartTime(Date.now())
      setDisplayProgress(0)
    } else if (!isCreatingDiagram && previousIsCreatingRef.current) {
      // 다이어그램 생성이 완료되었을 때
      if (diagramCreationProgress === 100) {
        setShowCompletionAlert(true)
        // 5초 후에 알림 자동으로 닫기
        setTimeout(() => {
          setShowCompletionAlert(false)
        }, 10000)
      }
      setCreationStartTime(null)
      setElapsedTime(0)
    }

    previousIsCreatingRef.current = isCreatingDiagram
  }, [isCreatingDiagram, creationStartTime, diagramCreationProgress])

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

  // 실제 진행률에 따라 표시 진행률을 부드럽게 업데이트 (2.5배 빠르게 조정)
  useEffect(() => {
    if (isCreatingDiagram) {
      // 실제 진행률과 표시 진행률의 차이
      const diff = diagramCreationProgress - displayProgress

      if (diff > 0) {
        // 진행률 증가 속도를 2.5배 빠르게 조정
        const incrementSize = diff < 5 ? 1.25 : diff < 10 ? 0.75 : 0.5

        const timer = setTimeout(() => {
          setDisplayProgress((prev) => Math.min(prev + incrementSize, diagramCreationProgress))
        }, 100)

        return () => clearTimeout(timer)
      }
    }
  }, [isCreatingDiagram, diagramCreationProgress, displayProgress])

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

  // 알림 닫기 핸들러
  const handleCloseAlert = () => {
    setShowCompletionAlert(false)
  }

  // Google 스타일 버튼 기본 클래스 - 반응형으로 설정
  const googleButtonClass =
    "bg-white border border-gray-300 rounded-md text-gray-700 font-medium text-sm hover:shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center px-2 py-2 sm:px-4 sm:py-2"

  // 아이콘 기본 클래스
  const iconClass = "h-5 w-5 sm:mr-2"

  // 텍스트 클래스 (반응형)
  const textClass = "hidden sm:inline whitespace-nowrap"

  return (
    <div className="p-3 border-b bg-white relative">
      {/* 완료 알림 */}
      {showCompletionAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
            <div className="bg-blue-50 p-4 flex items-start">
              <div className="flex-shrink-0">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-blue-800">도식화 완료</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>API 도식화가 성공적으로 완료되었습니다.</p>
                  <p className="mt-1">아래 버튼을 클릭하여 도식화 결과를 확인하세요.</p>
                </div>
              </div>
              <button onClick={handleCloseAlert} className="flex-shrink-0 ml-4 bg-blue-50 rounded-md inline-flex text-blue-500 hover:text-blue-700 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right">
              <button
                onClick={handleViewDiagram}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border border-blue-300 rounded-md hover:from-blue-100 hover:via-blue-200 hover:to-blue-100 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                도식화 보기
              </button>
              <button
                onClick={handleCloseAlert}
                className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-4 hidden sm:block">API 편집기</h2>
          <h2 className="text-lg font-semibold mr-4 sm:hidden">API</h2>
        </div>

        <div className="flex space-x-2">
          {/* 도식화 진행 버튼 */}
          {showDiagramButton && handleCreateDiagram && (
            <button
              onClick={handleCreateDiagram}
              disabled={isLoading || isCreatingDiagram}
              className={`${googleButtonClass} ${
                isLoading || isCreatingDiagram
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-blue-300 text-blue-700 hover:from-blue-100 hover:via-blue-200 hover:to-blue-100 hover:border-blue-400 hover:shadow-md"
              } relative overflow-hidden transition-all duration-300`}
              title="도식화 진행"
            >
              {isCreatingDiagram ? (
                <span className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></span>
              ) : (
                <>
                  {/* 향상된 그라데이션 효과 */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-40 animate-shimmer"></span>
                  {/* 추가 하이라이트 효과 */}
                  <span className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-100 to-transparent opacity-30 animate-pulse"></span>

                  {/* 버튼 중앙에 큰 반짝이는 효과 */}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-10 w-10 rounded-full bg-blue-300 opacity-40 animate-ping"></span>
                  </span>

                  <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-blue-600 relative z-10`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </>
              )}
              <span className={`${textClass} font-semibold relative z-10`}>도식화 진행</span>
            </button>
          )}

          {/* 도식화 보기 버튼 */}
          {apiSpecVersionId && (apiStatus === "AI_VISUALIZED" || apiStatus === "USER_COMPLETED") && (
            <button
              onClick={handleViewDiagram}
              className={`${googleButtonClass} bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-blue-300 text-blue-700 hover:from-blue-100 hover:via-blue-200 hover:to-blue-100 hover:border-blue-400 hover:shadow-md`}
              title="도식화 보기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-blue-600 relative z-10`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className={`${textClass} font-semibold relative z-10`}>도식화 보기</span>
            </button>
          )}

          <button
            onClick={handleSaveApi}
            disabled={isLoading || isCreatingDiagram}
            className={`${googleButtonClass} ${isLoading || isCreatingDiagram ? "opacity-50 cursor-not-allowed" : ""}`}
            title={apiSpecVersionId ? "수정하기" : "생성하기"}
          >
            {isLoading ? (
              <span className="h-5 w-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
                {apiSpecVersionId ? (
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                )}
              </svg>
            )}
            <span className={textClass}>{apiSpecVersionId ? "수정하기" : "생성하기"}</span>
          </button>

          {apiSpecVersionId && (
            <button
              onClick={handleDeleteApi}
              disabled={isLoading || isCreatingDiagram}
              className={`${googleButtonClass} ${isLoading || isCreatingDiagram ? "opacity-50 cursor-not-allowed" : ""}`}
              title="삭제하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className={textClass}>삭제하기</span>
            </button>
          )}
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
                <button onClick={handleCancelDiagramCreation} className={googleButtonClass} title="취소">
                  <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className={textClass}>취소</span>
                </button>
              )}
            </div>
          </div>

          {/* 진행 단계 표시 */}
          {diagramCreationStep && <div className="text-sm text-blue-700 mb-2">{diagramCreationStep}</div>}

          {/* 진행률 표시 - 부드러운 애니메이션 적용 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${displayProgress}%` }}></div>
          </div>

          <div className="text-xs text-right text-blue-600">{Math.round(displayProgress)}% 완료</div>
        </div>
      )}
    </div>
  )
}

export default ApiHeader
