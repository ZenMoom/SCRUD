"use client"

import { useState, useEffect } from "react"
import axios from "axios"
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
  apiSpecVersionId?: number // API 스펙 ID 추가
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

  // API 스펙 목록 조회 및 변환
  const fetchApiSpecs = async (projectId: number) => {
    setIsLoading(true)
    try {
      // 백엔드에서 API 스펙 목록 조회
      const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(`http://localhost:8081/api/v1/api-specs/by-project/${projectId}`)

      // 응답 데이터를 ApiGroup 형식으로 변환
      const apiSpecsList = response.data.content || []

      // 경로별로 API 그룹화
      const groupMap = new Map<string, ApiEndpoint[]>()

      apiSpecsList.forEach((spec) => {
        // API 경로에서 그룹 이름 추출 (예: "api/v1/users/me" -> "api/v1/users")
        const pathParts = spec.endpoint?.split("/") || []
        const groupPath = pathParts.slice(0, pathParts.length - 1).join("/")

        if (!groupMap.has(groupPath)) {
          groupMap.set(groupPath, [])
        }

        // 엔드포인트 정보 생성
        const endpoint: ApiEndpoint = {
          id: `endpoint-${spec.apiSpecVersionId}`,
          path: spec.endpoint || "",
          method: spec.httpMethod || "GET",
          status: "done", // 기본적으로 완료 상태로 설정
          apiSpecVersionId: spec.apiSpecVersionId,
        }

        groupMap.get(groupPath)?.push(endpoint)
      })

      // Map을 ApiGroup 배열로 변환
      const newGroups: ApiGroup[] = []
      groupMap.forEach((endpoints, name) => {
        newGroups.push({
          id: `group-${name.replace(/\//g, "-")}`,
          name,
          endpoints,
        })
      })

      // 빈 그룹이면 기본 그룹 추가
      if (newGroups.length === 0) {
        newGroups.push({
          id: "default-group",
          name: "api/v1",
          endpoints: [],
        })
      }

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

  // API 스펙이 변경되었을 때 목록 새로고침
  const handleApiSpecChanged = () => {
    fetchApiSpecs(scrudProjectId)
  }

  return (
    <div className="flex h-[calc(100vh-152px)] overflow-hidden bg-gray-50 gap-1">
      <div className="w-[200px] h-full bg-white shadow-sm border-r">
        <LeftContainer />
      </div>
      <div className="w-[320px] h-full bg-white shadow-sm border-r">
        <MiddleContainer onApiSelect={handleApiSelect} apiGroups={apiGroups} setApiGroups={setApiGroups} isLoading={isLoading} />
      </div>
      <div className="flex-1 h-full bg-white shadow-sm">
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
