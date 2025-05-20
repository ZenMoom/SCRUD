"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight } from "lucide-react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./right-container"
import { ApiProcessStateEnumDto, ApiSpecVersionResponse } from "@generated/model"
import useAuthStore from "@/app/store/useAuthStore"

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

// GlobalFile 인터페이스 추가
interface GlobalFile {
  globalFileId: number
  fileName: string
  fileType: string
  fileUrl?: string
  fileContent: string
}

interface ApiCreatorProps {
  projectId?: number // URL에서 받은 프로젝트 ID
  globalFiles: GlobalFile[] // 전역 파일 데이터
}

export default function ApiCreator({ projectId = 1, globalFiles }: ApiCreatorProps) {
  // useAuthStore에서 토큰 가져오기
  const { token } = useAuthStore()

  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [scrudProjectId, setScrudProjectId] = useState<number>(projectId) // 기본값으로
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(false) // 여기를 false로 변경
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
    if (projectId && projectId !== scrudProjectId) {
      setScrudProjectId(projectId)
      // 프로젝트 변경 시 선택된 API 초기화
      setSelectedApi(null)
      setSelectedMethod(null)
    }
  }, [projectId, scrudProjectId])

  // API 스펙 목록 조회 및 변환 (그룹화 로직)
  const fetchApiSpecs = useCallback(
    async (projectId: number) => {
      setIsLoading(true)
      try {
        // 백엔드에서 API 스펙 목록 조회 - Bearer 토큰 추가
        const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(`/api/api-specs/by-project/${projectId}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        })

        // 응답 데이터를 ApiGroup 형식으로 변환
        const apiSpecsList = response.data.content || []

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

          // 타입스크립트 에러 해결을 위해 안전하게 타입 캐스팅
          const apiStatus = (spec as { apiSpecStatus?: ApiProcessStateEnumDto }).apiSpecStatus || "AI_GENERATED"

          // 엔드포인트 정보 생성 - 고유 ID 보장
          const uniqueId = `endpoint-${spec.apiSpecVersionId || ""}-${baseTimestamp + index}`
          const endpointObj: ApiEndpoint = {
            id: uniqueId,
            path: endpoint,
            method: spec.httpMethod || "GET",
            status: apiStatus, // 백엔드에서 받은 상태값 사용
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
        setApiGroups(newGroups)
      } catch {
        alert("API 스펙을 가져오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    },
    [token]
  ) // token을 의존성 배열에 추가

  // 처음 로드 시 API 스펙 목록 조회 및 프로젝트 ID가 변경될 때마다 다시 조회
  useEffect(() => {
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
    fetchApiSpecs(scrudProjectId)
  }, [scrudProjectId, fetchApiSpecs])

  return (
    <div className="bg-blue-50 p-2 relative">
      <div className="max-w-full mx-auto">
        {/* 3단 레이아웃 - 캔버스 페이지와 동일한 스타일 적용 */}
        <div className="flex flex-col md:flex-row gap-3 h-[calc(100vh-4.8rem)] overflow-hidden">
          {/* 좌측 패널 토글 버튼*/}
          <div className="absolute top-5 left-3 z-20">
            <button
              className="bg-white w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors focus:outline-none border"
              onClick={toggleLeftPanel}
              aria-label={isLeftPanelOpen ? "패널 닫기" : "패널 열기"}
            >
              {isLeftPanelOpen ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
            </button>
          </div>

          {/* 좌측 패널 - 자연스러운 트랜지션 효과 복원 */}
          <div className={`${isLeftPanelOpen ? "w-[300px]" : "w-[44px]"} h-full transition-all duration-300 ease-in-out bg-white rounded-lg`}>
            <div className={`${isLeftPanelOpen ? "w-[300px] opacity-100" : "w-0 opacity-0"} h-full rounded-lg bg-white shadow-md overflow-y-auto transition-all duration-300 ease-in-out`}>
              <LeftContainer completed={completed} activeItem={activeItem} onItemClick={handleSidebarItemClick} globalFiles={globalFiles} />
            </div>
          </div>

          {/* 중앙 패널 - 좌측 패널이 닫히면 이 패널이 더 커지도록 수정 */}
          <div className={`${isLeftPanelOpen ? "w-[320px]" : "w-[570px]"} rounded-lg h-full bg-white shadow-sm border-r transition-all duration-300 overflow-hidden`}>
            <MiddleContainer onApiSelect={handleApiSelect} apiGroups={apiGroups} setApiGroups={setApiGroups} isLoading={isLoading} scrudProjectId={scrudProjectId} />
          </div>

          {/* 우측 패널 - 고정 너비로 수정 */}
          <div className="w-[calc(100%-580px)] h-full rounded-lg bg-white shadow-sm overflow-hidden">
            <RightContainer
              selectedApi={selectedApi}
              selectedMethod={selectedMethod}
              onToggleVersionPanel={toggleVersionPanel}
              scrudProjectId={scrudProjectId}
              onApiSpecChanged={handleApiSpecChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
