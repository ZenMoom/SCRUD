"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight } from "lucide-react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./RightContainer"
import { ApiSpecVersionResponse } from "@generated/model"

// API 엔드포인트 인터페이스 (MiddleContainer에서 사용하는 형식)
interface ApiEndpoint {
  id: string
  path: string
  method: string
  status: "todo" | "progress" | "done"
  apiSpecVersionId?: number
}

// API 그룹 인터페이스
interface ApiGroup {
  id: string
  name: string
  endpoints: ApiEndpoint[]
}

export default function ApiCreator() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [scrudProjectId, setScrudProjectId] = useState<number>(1)
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
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

  // API 스펙 목록 조회 및 변환 (그룹화 로직)
  const fetchApiSpecs = async (projectId: number) => {
    setIsLoading(true)
    try {
      // 백엔드에서 API 스펙 목록 조회
      const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(`/api/api-specs/by-project/${projectId}`)

      // 응답 데이터를 ApiGroup 형식으로 변환
      const apiSpecsList = response.data.content || []

      console.log("API 스펙 목록 가져옴:", apiSpecsList)

      // 경로별로 API 그룹화
      const groupMap = new Map<string, ApiEndpoint[]>()

      // 현재 타임스탬프 한 번만 생성
      const baseTimestamp = Date.now()

      apiSpecsList.forEach((spec, index) => {
        // API 경로에서 그룹 이름 추출
        const endpoint = spec.endpoint || ""

        // 그룹화 로직 개선: /api/v1 다음에 오는 리소스 이름까지 포함
        const pathParts = endpoint.split("/").filter((part) => part.length > 0)

        // 기본 그룹 경로 설정
        let groupPath = "/"

        // 경로 분석: 보통 /api/v1/resource/action 또는 /api/v1/resource/{id} 패턴
        if (pathParts.length >= 3) {
          // /api/v1/resource 까지 그룹화 (3단계)
          groupPath = "/" + pathParts.slice(0, 3).join("/")
        } else if (pathParts.length === 2) {
          // /api/v1 까지만 있으면 그대로 사용
          groupPath = "/" + pathParts.join("/")
        } else if (pathParts.length === 1) {
          // 단일 경로는 그대로 사용
          groupPath = "/" + pathParts[0]
        }

        // 마지막 부분에 {id}와 같은 패턴이 있는지 확인하여 그룹화에서 제외
        const allParts = endpoint.split("/")
        const lastPart = allParts[allParts.length - 1]

        // 경로 마지막 부분이 {id}와 같은 형식이면 그 부분을 제외하고 그룹화
        if (lastPart && (lastPart.includes("{") || lastPart.includes("}"))) {
          // 마지막 부분을 제외한 경로를 그룹 이름으로 사용
          groupPath = allParts.slice(0, allParts.length - 1).join("/") || "/"
        }

        if (!groupMap.has(groupPath)) {
          groupMap.set(groupPath, [])
        }

        // 엔드포인트 정보 생성 - 고유 ID 보장
        const uniqueId = `endpoint-${spec.apiSpecVersionId || ""}-${baseTimestamp + index}`
        const endpointObj: ApiEndpoint = {
          id: uniqueId,
          path: endpoint,
          method: spec.httpMethod || "GET",
          status: "done", // 기본적으로 완료 상태로 설정
          apiSpecVersionId: spec.apiSpecVersionId,
        }

        groupMap.get(groupPath)?.push(endpointObj)
      })

      // Map을 ApiGroup 배열로 변환
      const newGroups: ApiGroup[] = []

      // 그룹 정렬: '/api/v1'로 시작하는 그룹을 항상 먼저, 그 다음 알파벳 순
      const sortedGroups = Array.from(groupMap.entries()).sort(([a], [b]) => {
        // 모두 /api/v1로 시작하면 나머지 부분으로 정렬
        if (a.startsWith("/api/v1") && b.startsWith("/api/v1")) {
          return a.localeCompare(b)
        }
        // /api/v1으로 시작하는 것이 먼저
        if (a.startsWith("/api/v1")) return -1
        if (b.startsWith("/api/v1")) return 1
        return a.localeCompare(b)
      })

      sortedGroups.forEach(([name, endpoints], groupIndex) => {
        // 엔드포인트 정렬: HTTP 메서드 순 (GET, POST, PUT, PATCH, DELETE)
        const sortedEndpoints = [...endpoints].sort((a, b) => {
          const methodOrder = { GET: 1, POST: 2, PUT: 3, PATCH: 4, DELETE: 5 }
          const orderA = methodOrder[a.method as keyof typeof methodOrder] || 99
          const orderB = methodOrder[b.method as keyof typeof methodOrder] || 99
          return orderA - orderB
        })

        newGroups.push({
          id: `group-${name.replace(/\//g, "-")}-${baseTimestamp + groupIndex}`,
          name,
          endpoints: sortedEndpoints,
        })
      })

      // 빈 그룹이면 기본 그룹 추가
      if (newGroups.length === 0) {
        newGroups.push({
          id: `default-group-${baseTimestamp}`,
          name: "/api/v1",
          endpoints: [],
        })
      }

      console.log("그룹화된 API 목록:", newGroups)
      setApiGroups(newGroups)
    } catch (error) {
      console.error("API 스펙 목록 조회 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 처음 로드 시 API 스펙 목록 조회
  useEffect(() => {
    fetchApiSpecs(scrudProjectId)
  }, [scrudProjectId])

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
    console.log("API 스펙 변경 감지: 목록 새로고침")
    fetchApiSpecs(scrudProjectId)
  }, [scrudProjectId]) // scrudProjectId만 의존성으로 추가

  return (
    <div className="flex h-[calc(100vh-152px)] overflow-hidden bg-gray-50 gap-1 relative">
      {/* 좌측 패널 - 접었다 펼칠 수 있게 수정 */}
      {/* <div className={`${isLeftPanelOpen ? "w-[300px]" : "w-0 opacity-0"} h-full bg-white shadow-md transition-all duration-300 ease-in-out overflow-y-auto`}>
        <LeftContainer completed={completed} activeItem={activeItem} onItemClick={handleSidebarItemClick} />
      </div> */}

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
        <MiddleContainer onApiSelect={handleApiSelect} apiGroups={apiGroups} setApiGroups={setApiGroups} isLoading={isLoading} />
      </div>
      <div className="flex-1 h-full bg-white shadow-sm overflow-hidden">
        <RightContainer
          selectedApi={selectedApi}
          selectedMethod={selectedMethod}
          onToggleVersionPanel={toggleVersionPanel}
          scrudProjectId={scrudProjectId}
          onScrudProjectIdChange={setScrudProjectId}
          onApiSpecChanged={handleApiSpecChanged}
        />
      </div>
    </div>
  )
}
