"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight } from "lucide-react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./right-container"
import { ApiProcessStateEnumDto, ApiSpecVersionResponse } from "@generated/model"

// API 엔드포인트 인터페이스 (MiddleContainer에서 사용하는 형식)
interface ApiEndpoint {
  id: string
  path: string
  method: string
  status: ApiProcessStateEnumDto
  apiSpecVersionId?: number
}

// API 그룹 인터페이스
interface ApiGroup {
  id: string
  name: string
  endpoints: ApiEndpoint[]
}

interface ApiCreatorProps {
  projectId?: number // URL에서 받은 프로젝트 ID
}

export default function ApiCreator({ projectId = 1 }: ApiCreatorProps) {
  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [scrudProjectId, setScrudProjectId] = useState<number>(projectId) // 기본값으로 전달받은 프로젝트 ID 사용
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

  // API 스펙 목록 조회 및 변환 (그룹화 로직)
  const fetchApiSpecs = useCallback(async (projectId: number) => {
    console.log("fetchApiSpecs 호출됨 - projectId:", projectId)
    setIsLoading(true)
    try {
      // 백엔드에서 API 스펙 목록 조회
      const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(`/api/api-specs/by-project/${projectId}`)

      // 응답 데이터를 ApiGroup 형식으로 변환
      const apiSpecsList = response.data.content || []

      console.log(`프로젝트 ${projectId}의 API 스펙 목록 가져옴:`, apiSpecsList)

      // 경로별로 API 그룹화
      const groupMap = new Map<string, ApiEndpoint[]>()

      // 현재 타임스탬프 한 번만 생성
      const baseTimestamp = Date.now()

      apiSpecsList.forEach((spec, index) => {
        // API 경로에서 그룹 이름 추출
        const endpoint = spec.endpoint || ""

        // 그룹화 로직 개선: 정확히 /api/v1/resource 형태로 그룹화
        const pathParts = endpoint.split("/").filter((part) => part.length > 0)

        // 기본 그룹 경로 설정
        let groupPath = "/"

        // 명확한 리소스 기반 그룹화: /api/v1/{resource} 패턴 강제
        if (pathParts.length >= 3) {
          // 항상 3단계까지만 그룹화: /api/v1/resource
          groupPath = "/" + pathParts.slice(0, 3).join("/")

          // 경로에 중괄호({})가 포함된 경우 처리
          if (groupPath.includes("{") || groupPath.includes("}")) {
            // 파라미터가 포함된 경우 그 이전 수준까지 그룹화
            const parts = groupPath.split("/")
            const cleanParts = parts.filter((part) => !part.includes("{") && !part.includes("}"))
            groupPath = cleanParts.join("/") || "/"
          }
        } else if (pathParts.length === 2) {
          // /api/v1과 같은 경우
          groupPath = "/" + pathParts.join("/")
        } else if (pathParts.length === 1) {
          // 단일 경로
          groupPath = "/" + pathParts[0]
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
          status: "AI_GENERATED" as ApiProcessStateEnumDto, // 기본적으로 완료 상태로 설정
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

          // 먼저 메서드로 정렬하고, 같은 메서드면 경로로 정렬
          if (orderA === orderB) {
            return a.path.localeCompare(b.path)
          }
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

      console.log(`프로젝트 ${projectId}의 그룹화된 API 목록:`, newGroups)
      setApiGroups(newGroups)
    } catch (error) {
      console.error(`프로젝트 ${projectId}의 API 스펙 목록 조회 오류:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 처음 로드 시 API 스펙 목록 조회 및 프로젝트 ID가 변경될 때마다 다시 조회
  useEffect(() => {
    console.log("API 스펙 목록 조회 useEffect 실행 - scrudProjectId:", scrudProjectId)
    fetchApiSpecs(scrudProjectId)
  }, [scrudProjectId, fetchApiSpecs])

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
    fetchApiSpecs(scrudProjectId)
  }, [scrudProjectId, fetchApiSpecs])

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
        <MiddleContainer
          onApiSelect={handleApiSelect}
          apiGroups={apiGroups}
          setApiGroups={setApiGroups}
          isLoading={isLoading}
          scrudProjectId={scrudProjectId} // MiddleContainer에 프로젝트 ID 전달
        />
      </div>
      <div className="flex-1 h-full bg-white shadow-sm overflow-hidden">
        <RightContainer selectedApi={selectedApi} selectedMethod={selectedMethod} onToggleVersionPanel={toggleVersionPanel} scrudProjectId={scrudProjectId} onApiSpecChanged={handleApiSpecChanged} />
      </div>
    </div>
  )
}
