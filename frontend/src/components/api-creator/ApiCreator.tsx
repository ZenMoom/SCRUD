"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./right-container"

import useAuthStore from "@/app/store/useAuthStore"
import useApiStore from "@/app/store/useApiStore"

interface ApiCreatorProps {
  projectId?: number // URL에서 받은 프로젝트 ID
}

export default function ApiCreator({ projectId }: ApiCreatorProps) {
  // useAuthStore에서 토큰 가져오기
  const { token } = useAuthStore()

  // useApiStore에서 fetchApiSpecs 가져오기
  const fetchApiSpecs = useApiStore((state) => state.fetchApiSpecs)

  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  // scrudProjectId 상태 초기화를 안전하게 처리 - number | null 타입으로 선언
  const [scrudProjectId, setScrudProjectId] = useState<number | null>(() => {
    // projectId가 undefined인 경우 null로 설정하여 나중에 검사 가능하게 함
    return projectId !== undefined && projectId > 0 ? projectId : null
  })
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true)
  const [activeItem, setActiveItem] = useState<string>("title")
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    serverUrl: false,
    requirementSpec: false,
    erd: false,
    dependencyFile: false,
    utilityClass: false,
    errorCode: false,
    securitySetting: false,
    codeConvention: false,
    architectureStructure: false,
  })

  // URL에서 프로젝트 ID가 변경될 때 상태 업데이트
  useEffect(() => {
    console.log("ApiCreator - projectId from props:", projectId)
    console.log("ApiCreator - current scrudProjectId:", scrudProjectId)
    if (projectId && projectId !== scrudProjectId) {
      console.log("프로젝트 ID 변경:", projectId)
      setScrudProjectId(projectId)
      // 프로젝트 변경 시 선택된 API 초기화
      setSelectedApi(null)
      setSelectedMethod(null)
    }
  }, [projectId, scrudProjectId])

  // 처음 로드 시 API 스펙 목록 조회 및 프로젝트 ID가 변경될 때마다 다시 조회
  useEffect(() => {
    console.log("API 스펙 목록 조회 useEffect 실행 - scrudProjectId:", scrudProjectId)

    // 유효한 프로젝트 ID와 토큰이 있는 경우에만 API 호출
    if (scrudProjectId !== null && token && typeof token === "string") {
      fetchApiSpecs(scrudProjectId, token)
    }
  }, [scrudProjectId, fetchApiSpecs, token])

  // API 선택 핸들러
  const handleApiSelect = (apiPath: string, apiMethod: string) => {
    setSelectedApi(apiPath)
    setSelectedMethod(apiMethod)
  }

  // 버전 패널 토글 핸들러
  const toggleVersionPanel = () => {
    // 버전 패널 토글 로직
  }

  // 좌측 패널 토글 핸들러
  const toggleLeftPanel = () => {
    setIsLeftPanelOpen(!isLeftPanelOpen)
  }

  // 사이드바 항목 클릭 핸들러
  const handleSidebarItemClick = (item: string) => {
    setActiveItem(item)
    setCompleted((prev) => ({
      ...prev,
      [item]: !prev[item],
    }))
  }

  // API 스펙이 변경되었을 때 목록 새로고침
  const handleApiSpecChanged = useCallback(() => {
    console.log("API 스펙 변경 감지: 목록 새로고침 - scrudProjectId:", scrudProjectId)

    // 유효한 프로젝트 ID와 토큰이 있는 경우에만 새로고침
    if (scrudProjectId !== null && token && typeof token === "string") {
      fetchApiSpecs(scrudProjectId, token, true) // forceRefresh = true로 설정
    }
  }, [scrudProjectId, fetchApiSpecs, token])

  return (
    <div className="flex h-[calc(100vh-152px)] overflow-hidden bg-gray-50 gap-1 relative py-1 mt-2">
      {/* 좌측 패널 - 접었다 펼칠 수 있게 수정 */}
      <div className={`${isLeftPanelOpen ? "w-[300px]" : "w-0 opacity-0"} h-full bg-white shadow-md transition-all duration-300 ease-in-out overflow-y-auto`}>
        <LeftContainer completed={completed} activeItem={activeItem} onItemClick={handleSidebarItemClick} />
      </div>

      {/* 좌측 패널 토글 버튼 - 개선된 위치 및 스타일 */}
      <div className={`absolute top-1/2 transform -translate-y-1/2 ${isLeftPanelOpen ? "left-[300px]" : "left-0"} transition-all duration-300 z-20`}>
        <button
          className="bg-white w-6 h-24 flex items-center justify-center rounded-r-md shadow-md hover:bg-gray-50 transition-colors focus:outline-none"
          onClick={toggleLeftPanel}
          aria-label={isLeftPanelOpen ? "패널 닫기" : "패널 열기"}
        >
          {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      <div className={`${isLeftPanelOpen ? "w-[320px]" : "w-[350px]"} h-full bg-white shadow-sm border-r transition-all duration-300 overflow-hidden`}>
        {scrudProjectId !== null ? (
          <MiddleContainer
            onApiSelect={handleApiSelect}
            scrudProjectId={scrudProjectId} // 여기서는 null이 아님이 보장됨
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">유효한 프로젝트를 선택해주세요</p>
          </div>
        )}
      </div>
      <div className="flex-1 h-full bg-white shadow-sm overflow-hidden">
        {scrudProjectId !== null ? (
          <RightContainer
            selectedApi={selectedApi}
            selectedMethod={selectedMethod}
            onToggleVersionPanel={toggleVersionPanel}
            scrudProjectId={scrudProjectId} // 여기서는 null이 아님이 보장됨
            onApiSpecChanged={handleApiSpecChanged}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">유효한 프로젝트를 선택해주세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
