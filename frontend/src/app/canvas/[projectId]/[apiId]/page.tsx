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

// 더미 데이터 임포트
import { dummyDiagramData } from "@/app/data/dummy-diagram-data"

// API 목록 아이템 타입 정의
interface ApiListItem {
  apiId: string
  name: string
  status: string
  description?: string
}

export default function CanvasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터 가져오기
  const params = useParams()
  const { projectId, apiId, versionId: pathVersionId } = params

  // 쿼리 파라미터에서 버전 ID 가져오기 또는, URL 경로에서 가져온 버전 ID 사용
  const queryVersionId = searchParams.get("version")
  const currentVersionId = queryVersionId || (pathVersionId as string)

  // 다이어그램 데이터 상태
  const [loading, setLoading] = useState<boolean>(true)

  // 채팅 데이터 상태 추가
  const [chatData, setChatData] = useState<ChatHistoryResponse | null>(null)
  const [chatLoading, setChatLoading] = useState<boolean>(true)
  const [chatError, setChatError] = useState<string | null>(null)

  // API 목록 데이터 상태 추가
  const [apiListVisible, setApiListVisible] = useState<boolean>(false)
  const [apiListData, setApiListData] = useState<ApiListItem[]>([])
  const [apiListLoading, setApiListLoading] = useState<boolean>(false)
  const [apiListError, setApiListError] = useState<string | null>(null)

  // 타겟 노드 상태 추가
  const [targetNodes, setTargetNodes] = useState<TargetNode[]>([])

  // 페이지 로드 시 다이어그램 데이터와 채팅 데이터 모두 가져오기
  useEffect(() => {
    fetchDiagramData()
    fetchChatData()
  }, [projectId, apiId, currentVersionId])

  // 다이어그램 데이터 가져오기 함수
  const fetchDiagramData = async () => {
    try {
      setLoading(true)

      // axios를 사용하여 API 호출
      const response = await axios.get<DiagramResponse>(`/api/canvas/${projectId}/${apiId}/${currentVersionId}`)

      console.log("다이어그램 데이터:", response.data)
    } catch (err) {
      console.error("다이어그램 데이터 가져오기 오류:", err)
    } finally {
      setLoading(false)
    }
  }

  // 채팅 데이터 가져오기 함수 추가
  const fetchChatData = async () => {
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
  }

  // API 목록 가져오기 함수 - 경로 수정
  const fetchApiList = async () => {
    try {
      setApiListLoading(true)
      setApiListError(null)

      // 프로젝트 ID가 필요함
      if (!projectId) {
        setApiListError("프로젝트 ID가 필요합니다.")
        return
      }

      // API 호출 - 경로 수정됨
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

  // API 완료 처리 함수 - 경로 수정
  const completeApi = async () => {
    try {
      // 프로젝트 ID와 API ID가 필요함
      if (!projectId || !apiId) {
        alert("프로젝트 ID와 API ID가 필요합니다.")
        return
      }

      // API 호출 - 경로 수정됨
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

  // // 모든 데이터를 새로고침하는 함수
  // const refreshAllData = () => {
  //   fetchDiagramData()
  //   fetchChatData()
  // }

  // 버전 이동 처리 함수
  const handleVersionMove = () => {
    // 현재 버전을 숫자로 변환
    const currentVersion = Number.parseInt(currentVersionId, 10)

    // 다음 버전 계산
    const nextVersion = currentVersion + 1

    // URL 업데이트 (새로고침 없이)
    router.replace(`/canvas/${projectId}/${apiId}?version=${nextVersion}`, {
      scroll: false, // 스크롤 위치 유지
    })
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
                    const uniqueKey = `api-item-${index}-${Date.now()}`

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
            {/* 현재 버전 표시 */}
            <span className="text-gray-600">현재 버전: {currentVersionId}</span>

            {/* 버전 이동 버튼 */}
            <button onClick={handleVersionMove} className="px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 transition-colors" disabled={loading || chatLoading}>
              버전 이동
            </button>
            <button onClick={completeApi} className="px-4 py-2 bg-purple-500 text-white font-medium rounded hover:bg-purple-600 transition-colors">
              API Complete
            </button>
          </div>
        </div>

        {/* 3단 레이아웃 - 비율 30:70 */}
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-3rem)] overflow-hidden">
          {/* 왼쪽 섹션 (비율 30%) - 채팅 데이터 전달 */}
          <div className="w-full md:w-[30%] min-w-0 h-full">
            <div className="h-full">
              <ChatContainer
                projectId={projectId as string}
                apiId={apiId as string}
                versionId={currentVersionId}
                chatData={chatData}
                loading={chatLoading}
                error={chatError}
                onRefresh={fetchChatData} // 채팅 데이터만 새로고침하는 함수 전달
                targetNodes={targetNodes} // 타겟 노드 전달
                onRemoveTarget={handleRemoveTarget} // 타겟 제거 핸들러 전달
              />
            </div>
          </div>

          {/* 오른쪽 섹션 (비율 70%) - 더미 데이터 사용 */}
          <div className="w-full md:w-[70%] min-w-0 h-full" id="diagram-container">
            <div className="h-full w-full">
              <DiagramContainer
                diagramData={dummyDiagramData as DiagramResponse}
                loading={false}
                error={null}
                onSelectionChange={handleTargetNodesChange} // 타겟 노드 변경 핸들러 전달
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
