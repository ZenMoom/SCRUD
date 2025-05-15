"use client"

import { useState, useEffect, useCallback } from "react"
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

// 버전 정보 타입 정의
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

  // 채팅 데이터 가져오기 함수
  const fetchChatData = useCallback(async () => {
    try {
      setChatLoading(true)
      setChatError(null)

      // axios를 사용하여 채팅 API 호출
      const response = await axios.get<ChatHistoryResponse>(`/api/chat/${projectId}/${apiId}`)

      setChatData(response.data)
      console.log("채팅 데이터:", response.data)
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
  }, [projectId, apiId])

  // 페이지 로드 시 채팅 데이터 먼저 가져오기
  useEffect(() => {
    fetchChatData()
  }, [projectId, apiId, fetchChatData]) // fetchChatData 의존성 추가

  // 채팅 데이터에서 버전 정보 추출
  useEffect(() => {
    if (chatData && chatData.content) {
      // 채팅 내역에서 버전 정보 추출
      const extractedVersions: VersionInfo[] = []

      // 버전 1은 항상 기본으로 추가 (채팅 내역에 없더라도)
      extractedVersions.push({
        versionId: "1",
        description: "초기 버전",
        timestamp: new Date().toISOString(),
      })

      chatData.content.forEach((item) => {
        if (item.systemChat?.versionInfo) {
          const { newVersionId, description } = item.systemChat.versionInfo

          // null/undefined 체크 및 기본값 설정
          const versionId = newVersionId || ""
          const versionDesc = description || "버전 설명 없음"

          // 중복 버전 체크 (버전 1은 이미 추가했으므로 중복 체크)
          if (versionId && !extractedVersions.some((v) => v.versionId === versionId)) {
            extractedVersions.push({
              versionId: versionId,
              description: versionDesc,
              timestamp: item.createdAt,
            })
          }
        }
      })

      // 버전 ID를 숫자로 변환하여 오름차순 정렬 (1, 2, 3, ...)
      extractedVersions.sort((a, b) => {
        const aNum = Number.parseInt(a.versionId, 10) || 0
        const bNum = Number.parseInt(b.versionId, 10) || 0
        return aNum - bNum
      })

      setVersions(extractedVersions)

      // URL에서 버전 파라미터가 있는 경우 해당 버전 선택
      if (versionParam) {
        setSelectedVersion(versionParam)
      } else if (extractedVersions.length > 0) {
        // 버전 파라미터가 없고 버전이 있는 경우 가장 최신 버전 선택
        const latestVersion = extractedVersions[extractedVersions.length - 1]
        setSelectedVersion(latestVersion.versionId)
        // URL 업데이트 (선택적)
        router.push(`/canvas/${projectId}/${apiId}?version=${latestVersion.versionId}`, { scroll: false })
      }
    }
  }, [chatData, versionParam, projectId, apiId, router])

  // 다이어그램 데이터 가져오기 함수 - 버전 ID를 파라미터로 받음
  const fetchDiagramData = useCallback(
    async (versionId: string) => {
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
    },
    [projectId, apiId]
  )

  // 선택된 버전이 변경되면 다이어그램 데이터 가져오기
  useEffect(() => {
    if (selectedVersion) {
      fetchDiagramData(selectedVersion)
    }
  }, [selectedVersion, fetchDiagramData]) // fetchDiagramData 의존성 추가

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

  // API 완료 처리 함수 - 현재 사용되지 않음
  // const completeApi = async () => {
  //   try {
  //     // 프로젝트 ID와 API ID가 필요함
  //     if (!projectId || !apiId) {
  //       alert("프로젝트 ID와 API ID가 필요합니다.")
  //       return
  //     }

  //     // API 호출
  //     const response = await axios.put(`/api/canvas-api/${projectId}/${apiId}`, {
  //       status: "USER_COMPLETED",
  //     })

  //     // 성공 메시지 표시
  //     alert("API를 완료했습니다.")
  //     console.log("API 완료 응답:", response.data)

  //     // 선택적으로 API 목록을 새로고침하여 최신 상태 반영
  //     if (apiListVisible) {
  //       fetchApiList()
  //     }
  //   } catch (err) {
  //     console.error("API 완료 처리 오류:", err)

  //     if (axios.isAxiosError(err)) {
  //       alert(`API 완료 처리 오류: ${err.response?.data?.error || err.message}`)
  //     } else {
  //       alert("API 완료 처리 중 오류가 발생했습니다.")
  //     }
  //   }
  // }

  // 모든 데이터를 새로고침하는 함수 - 현재 사용되지 않음
  // const refreshAllData = async () => {
  //   await fetchChatData()
  //   // 선택된 버전이 있으면 다이어그램 데이터도 새로고침
  //   if (selectedVersion) {
  //     await fetchDiagramData(selectedVersion)
  //   }
  // }

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

  // 마우스가 패널에 들어갈 때 호출
  const handleMouseEnter = () => {
    if (apiListData.length === 0) {
      fetchApiList()
    }
    setApiListVisible(true)
  }

  return (
    <div className="bg-blue-50 p-2 relative">
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
        {/* 3단 레이아웃 - 비율 30:70 */}
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-5rem)] overflow-hidden">
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
                onVersionSelect={handleVersionSelect}
              />
            </div>
          </div>

          {/* 오른쪽 섹션 (비율 70%) - 다이어그램 데이터 전달 */}
          <div className="w-full md:w-[70%] min-w-0 h-full" id="diagram-container">
            <div className="h-full w-full">
              {loading ? (
                <div className="h-full p-4 bg-white rounded-lg shadow flex justify-center items-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="h-full p-4 bg-white rounded-lg shadow flex justify-center items-center">
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg border-l-4 border-red-500">
                    <h3 className="font-semibold mb-2">오류 발생</h3>
                    <p>{error}</p>
                  </div>
                </div>
              ) : (
                <DiagramContainer
                  diagramData={diagramData}
                  loading={false}
                  error={null}
                  onSelectionChange={handleTargetNodesChange}
                  selectedVersion={selectedVersion}
                  versions={versions}
                  onVersionSelect={handleVersionSelect}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
