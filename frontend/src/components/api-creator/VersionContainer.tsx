"use client"

import { useState, useEffect } from "react"

interface ApiSpec {
  id: number
  version: string
  createdAt: string
  updatedAt: string
  endpoint: string
  apiGroup: string
  httpMethod: string
}

interface VersionContainerProps {
  selectedApi: string | null
}

export default function VersionContainer({ selectedApi }: VersionContainerProps) {
  const [apiVersions, setApiVersions] = useState<ApiSpec[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 선택된 API가 변경될 때마다 해당 API의 버전들을 가져옴
  useEffect(() => {
    if (selectedApi) {
      fetchApiVersions(selectedApi)
    }
  }, [selectedApi])

  // API 버전 조회 함수 (실제로는 백엔드에서 데이터 가져오기)
  const fetchApiVersions = async (apiPath: string) => {
    setIsLoading(true)
    try {
      // 예시를 위한 더미 데이터 - 실제 구현에서는 axios 요청으로 대체
      // const response = await axios.get(`/api/v1/api-specs/versions?path=${encodeURIComponent(apiPath)}`)
      // setApiVersions(response.data)

      // 더미 데이터 (실제 구현 시 삭제)
      setTimeout(() => {
        const dummyVersions = [
          {
            id: 1,
            version: "1.0.0",
            createdAt: "2025-05-01T09:00:00Z",
            updatedAt: "2025-05-01T09:00:00Z",
            endpoint: apiPath,
            apiGroup: apiPath.split("/")[1] || "default",
            httpMethod: "GET",
          },
          {
            id: 2,
            version: "1.0.1",
            createdAt: "2025-05-02T10:30:00Z",
            updatedAt: "2025-05-02T10:30:00Z",
            endpoint: apiPath,
            apiGroup: apiPath.split("/")[1] || "default",
            httpMethod: "GET",
          },
          {
            id: 3,
            version: "1.1.0",
            createdAt: "2025-05-05T14:20:00Z",
            updatedAt: "2025-05-05T14:20:00Z",
            endpoint: apiPath,
            apiGroup: apiPath.split("/")[1] || "default",
            httpMethod: "GET",
          },
        ]
        setApiVersions(dummyVersions)
        setIsLoading(false)
      }, 600)
    } catch (error) {
      console.error("API 버전 조회 오류:", error)
      setIsLoading(false)
    }
  }

  // 아코디언 토글 함수
  const toggleAccordion = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
    }
  }

  // 버전 적용 함수
  const applyVersion = (version: ApiSpec) => {
    // 실제 구현에서는 선택된 버전을 RightContainer에 로드하는 로직 추가
    alert(`버전 ${version.version}이 적용되었습니다.`)
  }

  // 버전 삭제 함수
  const deleteVersion = async (id: number) => {
    if (confirm("이 버전을 삭제하시겠습니까?")) {
      setIsLoading(true)
      try {
        // 실제 구현에서는 axios 요청으로 대체
        // await axios.delete(`/api/v1/api-specs/${id}`)

        // 더미 구현 (실제 구현 시 삭제)
        setTimeout(() => {
          setApiVersions(apiVersions.filter((version) => version.id !== id))
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("버전 삭제 오류:", error)
        setIsLoading(false)
      }
    }
  }

  // 날짜 형식 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-white h-full w-full flex flex-col">
      <div className="py-4 px-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">API 버전 관리</h2>
        {selectedApi && (
          <p className="text-sm text-gray-600 mt-1 truncate" title={selectedApi}>
            {selectedApi}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : apiVersions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>버전 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="p-3 divide-y divide-gray-100">
            {apiVersions.map((version) => (
              <div key={version.id} className="py-2">
                <button className="flex items-center justify-between w-full px-2 py-2 text-left text-sm rounded-md hover:bg-gray-50" onClick={() => toggleAccordion(version.id)}>
                  <div>
                    <span className="font-medium text-gray-800">v{version.version}</span>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(version.updatedAt)}</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-500 transform transition-transform ${expandedId === version.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 아코디언 내용 */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedId === version.id ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="p-3 bg-gray-50 rounded-md mt-1 text-xs">
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">메소드: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          version.httpMethod === "GET"
                            ? "bg-green-100 text-green-800"
                            : version.httpMethod === "POST"
                            ? "bg-blue-100 text-blue-800"
                            : version.httpMethod === "PUT"
                            ? "bg-yellow-100 text-yellow-800"
                            : version.httpMethod === "DELETE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {version.httpMethod}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">생성일: </span>
                      <span className="text-gray-600">{formatDate(version.createdAt)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">수정일: </span>
                      <span className="text-gray-600">{formatDate(version.updatedAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">API 그룹: </span>
                      <span className="text-gray-600">{version.apiGroup}</span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium" onClick={() => applyVersion(version)}>
                        적용하기
                      </button>
                      <button className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-xs font-medium" onClick={() => deleteVersion(version.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
