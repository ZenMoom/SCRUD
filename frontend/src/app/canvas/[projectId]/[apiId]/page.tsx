"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import type { DiagramResponse } from "@generated/model"
import type { ChatHistoryResponse } from "@generated/model"
import type { TargetNode } from "@/components/canvas/DiagramContainer"

// 컴포넌트 임포트
import ChatContainer from "@/components/canvas/ChatContainer"
import DiagramContainer from "@/components/canvas/DiagramContainer"

// API 목록 아이템 타입 정의
interface ApiListItem {
  apiId: string
  name: string
  status: string
  description?: string
}

// 버전 정보 타입 정의 - 수정: 모든 속성이 옵셔널하지 않도록 변경
interface VersionInfo {
  versionId: string
  description: string
  timestamp: string
}

export default function CanvasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터 가져오기
  const params = useParams()
  const { projectId, apiId } = params

  // 쿼리 파라미터에서 버전 ID 가져오기
  const versionParam = searchParams.get("version")

  // 다이어그램 데이터 상태
  const [diagramData, setDiagramData] = useState<DiagramResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 채팅 데이터 상태
  const [chatData, setChatData] = useState<ChatHistoryResponse | null>(null)
  const [chatLoading, setChatLoading] = useState<boolean>(true)
  const [chatError, setChatError] = useState<string | null>(null)

  // 버전 관련 상태
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(versionParam)

  // API 목록 데이터 상태
  const [apiListVisible, setApiListVisible] = useState<boolean>(false)
  const [apiListData, setApiListData] = useState<ApiListItem[]>([])
  const [apiListLoading, setApiListLoading] = useState<boolean>(false)
  const [apiListError, setApiListError] = useState<string | null>(null)

  // 타겟 노드 상태
  const [targetNodes, setTargetNodes] = useState<TargetNode[]>([])

  // 페이지 로드 시 채팅 데이터 먼저 가져오기
  useEffect(() => {
    fetchChatData()
  }, [projectId, apiId])

  // 채팅 데이터에서 버전 정보 추출 후 다이어그램 데이터 가져오기
  useEffect(() => {
    if (chatData && chatData.content) {
      // 채팅 내역에서 버전 정보 추출
      const extractedVersions: VersionInfo[] = []

      chatData.content.forEach((item) => {
        if (item.systemChat?.versionInfo) {
          const { newVersionId, description } = item.systemChat.versionInfo

          // null/undefined 체크 및 기본값 설정
          const versionId = newVersionId || ""
          const versionDesc = description || "버전 설명 없음"

          // 중복 버전 체크
          if (versionId && !extractedVersions.some((v) => v.versionId === versionId)) {
            extractedVersions.push({
              versionId: versionId,
              description: versionDesc,
              timestamp: item.createdAt,
            })
          }
        }
      })

      // 시간순으로 정렬 (최신 버전이 앞에 오도록)
      extractedVersions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setVersions(extractedVersions)

      // URL에서 버전 파라미터가 없는 경우 처리
      if (!versionParam) {
        let defaultVersion = "1" // 기본값

        // 채팅 내역이 있으면 가장 최신 버전(첫 번째 항목) 선택
        if (extractedVersions.length > 0) {
          defaultVersion = extractedVersions[0].versionId
        }

        // 상태 업데이트 및 URL 쿼리 파라미터 설정
        setSelectedVersion(defaultVersion)
        router.push(`/canvas/${projectId}/${apiId}?version=${defaultVersion}`, { scroll: false })
      }
    }
  }, [chatData, versionParam, projectId, apiId, router])

  // 선택된 버전이 변경되면 다이어그램 데이터 가져오기
  useEffect(() => {
    if (selectedVersion) {
      fetchDiagramData(selectedVersion)
    }
  }, [selectedVersion])

  // 채팅 데이터 가져오기 함수
  const fetchChatData = async () => {
    try {
      setChatLoading(true)
      setChatError(null)

      // axios를 사용하여 채팅 API 호출
      const response = await axios.get<ChatHistoryResponse>(`/api/chat/${projectId}/${apiId}`)

      setChatData(response.data)
      console.log("채팅 데이터:", response.data)

      // 채팅 데이터에서 시스템 응답의 버전 정보 확인
      if (response.data && response.data.content) {
        // 가장 최근의 시스템 응답에서 버전 정보 찾기
        const latestSystemChat = [...response.data.content].reverse().find((item) => item.systemChat?.versionInfo)

        if (latestSystemChat?.systemChat?.versionInfo) {
          const newVersionId = latestSystemChat.systemChat.versionInfo.newVersionId

          // 현재 URL의 버전과 다르면 URL 업데이트
          if (newVersionId && newVersionId !== versionParam) {
            console.log(`새로운 버전 감지: ${newVersionId}, URL 업데이트`)
            setSelectedVersion(newVersionId)
            router.push(`/canvas/${projectId}/${apiId}?version=${newVersionId}`, { scroll: false })
          }
        }
      }
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

  // 다이어그램 데이터 가져오기 함수 - 버전 ID를 파라미터로 받음
  const fetchDiagramData = async (versionId: string) => {
    try {
      setLoading(true)
      setError(null)

      // axios를 사용하여 API 호출 - 버전 ID를 쿼리 파라미터로 전달
      const response = await axios.get<DiagramResponse>(`/api/canvas/${projectId}/${apiId}?version=${versionId}`)

      // 응답 데이터 검증 및 변환
      if (response.data) {
        // 필요한 경우 응답 데이터 구조 변환
        const processedData: DiagramResponse = {
          ...response.data,
          // 필요한 경우 필드 변환 또는 기본값 설정
          components: response.data.components || [],
          connections: response.data.connections || [],
          dto: response.data.dto || [],
          metadata: response.data.metadata || {
            // 타입 호환성을 위해 MetadataDto 형식에 맞게 수정
            version: Number(versionId), // string을 number로 변환
            metadataId: "metadata-default",
            lastModified: new Date().toISOString(),
            name: "API",
            description: "API 설명",
          },
        }

        // 응답 데이터 저장
        setDiagramData(processedData)
        console.log("다이어그램 데이터:", processedData)
      } else {
        console.error("응답 데이터가 없습니다.")
        setError("응답 데이터가 없습니다.")
      }
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

  // API 목록 가져오기 함수
  const fetchApiList = async () => {
    try {
      setApiListLoading(true)
      setApiListError(null)

      // 프로젝트 ID가 필요함
      if (!projectId) {
        setApiListError("프로젝트 ID가 필요합니다.")
        return
      }

      // API 호출
      const response = await axios.get(`/api/canvas-api/${projectId}`)

      // 응답 데이터 구조 확인 및 로깅
      console.log("API 응답 데이터:", response.data)

      // 응답 데이터에서 API 목록 추출 (data.content 또는 data 자체가 배열일 수 있음)
      let apiList: ApiListItem[] = []

      if (response.data) {
        if (Array.isArray(response.data)) {
          // 응답이 직접 배열인 경우
          apiList = response.data
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // 응답이 { content: [...] } 형태인 경우
          apiList = response.data.content
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // 응답이 { items: [...] } 형태인 경우
          apiList = response.data.items
        } else {
          // 다른 응답 형태에 대한 처리
          console.warn("예상치 못한 API 응답 형식:", response.data)
        }
      }

      setApiListData(apiList)
      console.log("API 목록:", apiList)
    } catch (err) {
      console.error("API 목록 가져오기 오류:", err)

      if (axios.isAxiosError(err)) {
        setApiListError(err.response?.data?.error || err.message)
      } else {
        setApiListError("API 목록을 가져오는 중 오류가 발생했습니다.")
      }
    } finally {
      setApiListLoading(false)
    }
  }

  // API 완료 처리 함수
  const completeApi = async () => {
    try {
      // 프로젝트 ID와 API ID가 필요함
      if (!projectId || !apiId) {
        alert("프로젝트 ID와 API ID가 필요합니다.")
        return
      }

      // API 호출
      const response = await axios.put(`/api/canvas-api/${projectId}/${apiId}`, {
        status: "USER_COMPLETED",
      })

      // 성공 메시지 표시
      alert("API를 완료했습니다.")
      console.log("API 완료 응답:", response.data)

      // 선택적으로 API 목록을 새로고침하여 최신 상태 반영
      if (apiListVisible) {
        fetchApiList()
      }
    } catch (err) {
      console.error("API 완료 처리 오류:", err)

      if (axios.isAxiosError(err)) {
        alert(`API 완료 처리 오류: ${err.response?.data?.error || err.message}`)
      } else {
        alert("API 완료 처리 중 오류가 발생했습니다.")
      }
    }
  }

  // 모든 데이터를 새로고침하는 함수
  const refreshAllData = async () => {
    await fetchChatData()
    // 다이어그램 데이터는 채팅 데이터 로드 후 자동으로 갱신됨
  }

  // 버전 선택 핸들러 - 채팅 컴포넌트에서 호출됨
  const handleVersionSelect = (versionId: string) => {
    console.log(`버전 선택: ${versionId}`)

    // 이미 선택된 버전이면 무시
    if (selectedVersion === versionId) return

    // 상태 업데이트
    setSelectedVersion(versionId)

    // URL 쿼리 파라미터 업데이트 (페이지 새로고침 없이)
    router.push(`/canvas/${projectId}/${apiId}?version=${versionId}`, { scroll: false })
  }

  // 타겟 노드 변경 핸들러
  const handleTargetNodesChange = (nodes: TargetNode[]) => {
    setTargetNodes(nodes)
  }

  // 타겟 노드 제거 핸들러
  const handleRemoveTarget = (nodeId: string) => {
    // DiagramContainer 컴포넌트의 removeTargetNode 함수 호출
    const diagramContainer = document.getElementById("diagram-container")
    if (diagramContainer) {
      const event = new CustomEvent("removeTarget", { detail: { nodeId } })
      diagramContainer.dispatchEvent(event)
    }
  }

  // 마우스가 패널에 들어갈 때 호출
  const handleMouseEnter = () => {
    if (apiListData.length === 0) {
      fetchApiList()
    }
    setApiListVisible(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 relative">
      {/* 슬라이드 패널을 위한 트리거 영역 */}
      <div className="absolute left-0 top-0 bottom-0 w-6 z-10 cursor-pointer hover:bg-gray-200 hover:bg-opacity-50 transition-colors" onMouseEnter={handleMouseEnter} />

      {/* API 목록 슬라이드 패널 */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out z-20 w-80 ${apiListVisible ? "translate-x-0" : "-translate-x-full"}`}
        onMouseLeave={() => setApiListVisible(false)}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">API 목록</h2>
            <button onClick={() => setApiListVisible(false)} className="p-2 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {apiListLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : apiListError ? (
            <div className="text-red-500 p-4">{apiListError}</div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {apiListData.length === 0 ? (
                <p className="text-gray-500 text-center">API 목록이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {apiListData.map((item, index) => {
                    // 각 항목에 고유한 키 생성
                    const uniqueKey = `api-item-${index}-${item.apiId}`

                    return (
                      <li key={uniqueKey} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="font-medium text-lg">{item.name || "이름 없음"}</div>
                        <div className="text-sm text-gray-500 mb-1">ID: {item.apiId || "없음"}</div>
                        <div className="text-sm mb-1">
                          상태:
                          <span
                            className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                              item.status === "AI_VISUALIZED" ? "bg-green-100 text-green-800" : item.status === "AI_GENERATED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status || "알 수 없음"}
                          </span>
                        </div>
                        {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="pt-4">
            <button onClick={fetchApiList} className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" disabled={apiListLoading}>
              {apiListLoading ? "로딩 중..." : "새로고침"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">다이어그램 캔버스</h1>

          <div className="flex items-center gap-2">
            {/* 현재 선택된 버전 표시 */}
            {selectedVersion && <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">현재 버전: {selectedVersion}</div>}

            {/* 새로고침 버튼 */}
            <button onClick={refreshAllData} className="px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors" disabled={loading || chatLoading}>
              {loading || chatLoading ? "로딩 중..." : "새로고침"}
            </button>

            {/* API 완료 버튼 */}
            <button onClick={completeApi} className="px-4 py-2 bg-purple-500 text-white font-medium rounded hover:bg-purple-600 transition-colors">
              API Complete
            </button>
          </div>
        </div>

        {/* 버전 선택 버튼 그룹 */}
        {versions.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">버전 선택:</h2>
            <div className="flex flex-wrap gap-2">
              {versions.map((version) => (
                <button
                  key={version.versionId}
                  onClick={() => handleVersionSelect(version.versionId)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedVersion === version.versionId ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                  title={version.description}
                >
                  버전 {version.versionId}
                  <span className="ml-2 text-xs opacity-80">{new Date(version.timestamp).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3단 레이아웃 - 비율 30:70 */}
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-12rem)] overflow-hidden">
          {/* 왼쪽 섹션 (비율 30%) - 채팅 데이터 전달 */}
          <div className="w-full md:w-[30%] min-w-0 h-full">
            <div className="h-full">
              <ChatContainer
                projectId={projectId as string}
                apiId={apiId as string}
                versionId={selectedVersion || ""}
                chatData={chatData}
                loading={chatLoading}
                error={chatError}
                onRefresh={fetchChatData}
                targetNodes={targetNodes}
                onRemoveTarget={handleRemoveTarget}
                onVersionSelect={handleVersionSelect}
              />
            </div>
          </div>

          {/* 오른쪽 섹션 (비율 70%) - 다이어그램 데이터 전달 */}
          <div className="w-full md:w-[70%] min-w-0 h-full" id="diagram-container">
            <div className="h-full w-full">
              <DiagramContainer diagramData={diagramData} loading={loading} error={error} onSelectionChange={handleTargetNodesChange} selectedVersion={selectedVersion} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
