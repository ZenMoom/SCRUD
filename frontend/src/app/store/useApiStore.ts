import { create } from "zustand"
import { persist } from "zustand/middleware"
import axios from "axios"
import { ApiProcessStateEnumDto, ApiSpecVersionResponse } from "@generated/model"

// API 엔드포인트 인터페이스
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
  emoji?: string
  endpoints: ApiEndpoint[]
}

interface ApiState {
  // 상태
  apiGroups: Record<number, ApiGroup[]> // 프로젝트 ID를 키로 사용
  isLoading: boolean
  lastFetchTimestamps: Record<number, number> // 프로젝트별 마지막 fetch 시간 저장

  // 액션
  fetchApiSpecs: (projectId: number, token: string, forceRefresh?: boolean) => Promise<void>
  updateApiGroups: (projectId: number, groups: ApiGroup[]) => void
  updateEndpointStatus: (projectId: number, groupId: string, endpointId: string, status: ApiProcessStateEnumDto) => void
  clearApiGroups: (projectId: number) => void
}

// 캐시 만료 시간 (5분 = 300000ms)
const CACHE_EXPIRY_TIME = 300000

const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      apiGroups: {},
      isLoading: false,
      lastFetchTimestamps: {},

      fetchApiSpecs: async (projectId: number, token: string, forceRefresh = false) => {
        const currentTime = Date.now()
        const lastFetchTime = get().lastFetchTimestamps[projectId] || 0

        // 이미 로딩 중이면 중복 요청 방지
        if (get().isLoading) return

        // 캐시가 있고, 강제 새로고침이 아니며, 캐시 만료 시간이 지나지 않았으면 요청하지 않음
        if (get().apiGroups[projectId] && !forceRefresh && currentTime - lastFetchTime < CACHE_EXPIRY_TIME) {
          console.log(`Using cached API specs for project ${projectId}. Cache age: ${(currentTime - lastFetchTime) / 1000}s`)
          return
        }

        set({ isLoading: true })

        try {
          console.log(`Fetching API specs for project ${projectId}`)

          // 백엔드에서 API 스펙 목록 조회
          const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(`/api/api-specs/by-project/${projectId}`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          })

          // 응답 데이터를 ApiGroup 형식으로 변환
          const apiSpecsList = response.data.content || []
          console.log(`Retrieved ${apiSpecsList.length} API specs for project ${projectId}`)

          // 경로별로 API 그룹화
          const groupMap = new Map<string, ApiEndpoint[]>()
          const baseTimestamp = Date.now()

          apiSpecsList.forEach((spec, index) => {
            const endpoint = spec.endpoint || ""
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
              status: apiStatus,
              apiSpecVersionId: spec.apiSpecVersionId,
            }

            groupMap.get(groupPath)?.push(endpointObj)
          })

          // Map을 ApiGroup 배열로 변환
          const newGroups: ApiGroup[] = []

          // 그룹 정렬
          const sortedGroups = Array.from(groupMap.entries()).sort(([a], [b]) => {
            if (a.startsWith("/api/v1") && b.startsWith("/api/v1")) {
              return a.localeCompare(b)
            }
            if (a.startsWith("/api/v1")) return -1
            if (b.startsWith("/api/v1")) return 1
            return a.localeCompare(b)
          })

          // 이모지 배열
          const emojis = ["📊", "📈", "🚀", "💡", "✨", "🔍", "📱", "💻", "🎨", "🛠️", "⚙️", "🔧", "🔨", "📌", "📋", "📂", "📁", "🗃️", "🗄️", "📮"]

          sortedGroups.forEach(([name, endpoints], groupIndex) => {
            // HTTP 메서드로 엔드포인트 정렬
            const sortedEndpoints = [...endpoints].sort((a, b) => {
              const methodOrder = { GET: 1, POST: 2, PUT: 3, PATCH: 4, DELETE: 5 }
              const orderA = methodOrder[a.method as keyof typeof methodOrder] || 99
              const orderB = methodOrder[b.method as keyof typeof methodOrder] || 99

              if (orderA === orderB) {
                return a.path.localeCompare(b.path)
              }
              return orderA - orderB
            })

            // 현재 그룹에 대한 고정된 이모지 선택 (그룹마다 일관된 이모지를 유지)
            const emojiIndex = Math.abs(name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % emojis.length
            const groupEmoji = emojis[emojiIndex]

            newGroups.push({
              id: `group-${name.replace(/\//g, "-")}-${baseTimestamp + groupIndex}`,
              name,
              emoji: groupEmoji,
              endpoints: sortedEndpoints,
            })
          })

          // 빈 그룹이면 기본 그룹 추가
          if (newGroups.length === 0) {
            newGroups.push({
              id: `default-group-${baseTimestamp}`,
              name: "/api/v1",
              emoji: "📌",
              endpoints: [],
            })
          }

          // 상태 업데이트
          set((state) => ({
            apiGroups: {
              ...state.apiGroups,
              [projectId]: newGroups,
            },
            lastFetchTimestamps: {
              ...state.lastFetchTimestamps,
              [projectId]: currentTime,
            },
            isLoading: false,
          }))
        } catch (error) {
          console.error(`Error fetching API specs for project ${projectId}:`, error)
          set({ isLoading: false })
        }
      },

      updateApiGroups: (projectId, groups) => {
        set((state) => ({
          apiGroups: { ...state.apiGroups, [projectId]: groups },
        }))
      },

      updateEndpointStatus: (projectId, groupId, endpointId, status) => {
        set((state) => {
          // 해당 프로젝트의 API 그룹이 없으면 변경 없음
          if (!state.apiGroups[projectId]) return state

          // 해당 프로젝트의 API 그룹 복사
          const updatedGroups = state.apiGroups[projectId].map((group) => {
            if (group.id === groupId) {
              // 해당 그룹의 엔드포인트 업데이트
              const updatedEndpoints = group.endpoints.map((endpoint) => {
                if (endpoint.id === endpointId) {
                  return { ...endpoint, status }
                }
                return endpoint
              })
              return { ...group, endpoints: updatedEndpoints }
            }
            return group
          })

          return {
            apiGroups: {
              ...state.apiGroups,
              [projectId]: updatedGroups,
            },
          }
        })
      },

      clearApiGroups: (projectId) => {
        set((state) => {
          // 객체 구조 분해 대신 새로운 객체 생성 방식 사용
          const newApiGroups = { ...state.apiGroups }
          const newTimestamps = { ...state.lastFetchTimestamps }

          // 해당 프로젝트 ID 삭제
          delete newApiGroups[projectId]
          delete newTimestamps[projectId]

          return {
            apiGroups: newApiGroups,
            lastFetchTimestamps: newTimestamps,
          }
        })
      },
    }),
    {
      name: "api-store",
      // 버전 지정 - 스키마 변경시 증가
      version: 1,
      // 민감한 필드 제외 (필요시)
      partialize: (state) => ({
        apiGroups: state.apiGroups,
        lastFetchTimestamps: state.lastFetchTimestamps,
      }),
    }
  )
)

export default useApiStore
