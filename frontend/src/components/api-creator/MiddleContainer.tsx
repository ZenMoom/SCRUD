// MiddleContainer.tsx 파일 수정

"use client"

import { ApiProcessStateEnumDto } from "@generated/model"
import { useState, useRef, useEffect } from "react"

interface ApiEndpoint {
  id: string
  path: string
  method: string
  status: ApiProcessStateEnumDto // 상태 타입 변경
  apiSpecVersionId?: number
}

interface ApiGroup {
  id: string
  name: string
  endpoints: ApiEndpoint[]
}

interface MiddleContainerProps {
  onApiSelect: (apiPath: string, apiMethod: string) => void
  apiGroups: ApiGroup[]
  setApiGroups: React.Dispatch<React.SetStateAction<ApiGroup[]>>
  isLoading: boolean
  scrudProjectId: number
}

export default function MiddleContainer({ onApiSelect, apiGroups, setApiGroups, isLoading, scrudProjectId }: MiddleContainerProps) {
  console.log("MiddleContainer 렌더링 - scrudProjectId:", scrudProjectId)

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newEndpointPath, setNewEndpointPath] = useState("")

  // 엔드포인트 편집 시 인풋 참조
  const editInputRef = useRef<HTMLInputElement>(null)

  // API 그룹 추가 함수
  const addApiGroup = () => {
    console.log("그룹 추가 - 현재 프로젝트:", scrudProjectId)
    const newGroupId = `group-${Date.now()}`
    setApiGroups([
      ...apiGroups,
      {
        id: newGroupId,
        name: "api/v1/new",
        endpoints: [],
      },
    ])
    setEditingGroupId(newGroupId)
    setNewGroupName("api/v1/new")
  }

  // API 엔드포인트 추가 함수
  const addApiEndpoint = (groupId: string) => {
    console.log("엔드포인트 추가 - 현재 프로젝트:", scrudProjectId)
    const group = apiGroups.find((g) => g.id === groupId)
    if (!group) return

    const timestamp = Date.now()
    const newEndpointId = `${groupId}-endpoint-${timestamp}`
    const basePath = group.name
    const newEndpoint = {
      id: newEndpointId,
      path: `${basePath}/new`,
      method: "GET",
      status: "AI_GENERATED" as ApiProcessStateEnumDto, // 초기 상태 변경
    }

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: [...group.endpoints, newEndpoint],
          }
        }
        return group
      })
    )

    setEditingEndpointId(newEndpointId)
    setNewEndpointPath(`${basePath}/new`)
  }

  // API 그룹 삭제 함수
  const deleteApiGroup = (groupId: string) => {
    if (confirm("이 API 그룹을 삭제하시겠습니까?")) {
      setApiGroups(apiGroups.filter((group) => group.id !== groupId))
    }
  }

  // API 엔드포인트 삭제 함수 개선
  const deleteApiEndpoint = (groupId: string, endpointId: string) => {
    if (confirm("이 API 엔드포인트를 삭제하시겠습니까?")) {
      // 삭제 로직
      const updatedGroups = apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.filter((endpoint) => endpoint.id !== endpointId),
          }
        }
        return group
      })

      setApiGroups(updatedGroups)
      setEditingEndpointId(null) // 편집 상태 초기화

      console.log("엔드포인트 삭제됨:", endpointId, "프로젝트:", scrudProjectId) // 디버깅용 로그
    }
  }

  // API 그룹 이름 편집 시작
  const startEditingGroup = (groupId: string) => {
    const group = apiGroups.find((g) => g.id === groupId)
    if (group) {
      setEditingGroupId(groupId)
      setNewGroupName(group.name)
    }
  }

  // API 엔드포인트 편집 시작 - "..." 버튼 클릭 시 호출
  const startEditingEndpoint = (groupId: string, endpointId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // 이벤트 전파 방지
    }

    const group = apiGroups.find((g) => g.id === groupId)
    const endpoint = group?.endpoints.find((e) => e.id === endpointId)

    if (endpoint) {
      setEditingEndpointId(endpointId)
      setNewEndpointPath(endpoint.path)

      // 다음 렌더링 후 인풋에 포커스
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus()
          editInputRef.current.select()
        }
      }, 0)
    }
  }

  // API 그룹 이름 저장
  const saveGroupName = () => {
    if (!editingGroupId || !newGroupName.trim()) return

    console.log("그룹명 저장 - 프로젝트:", scrudProjectId)

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === editingGroupId) {
          // 그룹 이름 변경 시 하위 엔드포인트 경로도 함께 수정
          const oldName = group.name
          const updatedEndpoints = group.endpoints.map((endpoint) => ({
            ...endpoint,
            path: endpoint.path.replace(oldName, newGroupName),
          }))

          return {
            ...group,
            name: newGroupName,
            endpoints: updatedEndpoints,
          }
        }
        return group
      })
    )

    setEditingGroupId(null)
  }

  // API 엔드포인트 저장
  const saveEndpoint = (groupId: string) => {
    if (!editingEndpointId || !newEndpointPath.trim()) return

    console.log("엔드포인트 저장 - 프로젝트:", scrudProjectId)

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.map((endpoint) => {
              if (endpoint.id === editingEndpointId) {
                return {
                  ...endpoint,
                  path: newEndpointPath,
                }
              }
              return endpoint
            }),
          }
        }
        return group
      })
    )

    setEditingEndpointId(null)
  }

  // API 상태 변경 함수 (수정)
  const updateEndpointStatus = async (groupId: string, endpointId: string, status: ApiProcessStateEnumDto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // 상태 변경 시 클릭 이벤트 전파 방지
    }

    // 먼저 UI 상태 업데이트
    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.map((endpoint) => {
              if (endpoint.id === endpointId) {
                return {
                  ...endpoint,
                  status,
                }
              }
              return endpoint
            }),
          }
        }
        return group
      })
    )

    // API ID 가져오기
    const group = apiGroups.find((g) => g.id === groupId)
    const endpoint = group?.endpoints.find((e) => e.id === endpointId)

    if (endpoint && endpoint.apiSpecVersionId) {
      // API 호출하여 상태 업데이트
      try {
        const response = await fetch(`/api/canvas-api/${scrudProjectId}/${endpoint.apiSpecVersionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API 상태 업데이트 실패:", errorData)
          // 실패 시 에러 처리 (예: 토스트 메시지 등)
        }
      } catch (error) {
        console.error("API 상태 업데이트 중 오류 발생:", error)
        // 실패 시 에러 처리
      }
    } else {
      console.warn("apiSpecVersionId가 없어 서버에 상태 업데이트를 할 수 없습니다.")
    }
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingGroupId(null)
    setEditingEndpointId(null)
  }

  // 엔터 키 입력 시 저장
  const handleKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === "Enter") {
      saveEndpoint(groupId)
    } else if (e.key === "Escape") {
      cancelEditing()
    }
  }

  // 외부 클릭 시 편집 취소
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingEndpointId) {
        // 클릭된 요소가 삭제 버튼인지 확인
        const isDeleteButton = (e.target as Element)?.closest('[data-delete-button="true"]')

        // 인풋이나 삭제 버튼이 아닌 곳을 클릭했을 때만 편집 모드 종료
        if (!editInputRef.current?.contains(e.target as Node) && !isDeleteButton) {
          cancelEditing()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [editingEndpointId])

  // 상태에 따른 색상 및 텍스트 표시 (수정)
  const getStatusStyle = (status: ApiProcessStateEnumDto) => {
    switch (status) {
      case "AI_GENERATED":
        return "bg-gray-200 text-gray-700" // AI 생성됨 - 회색
      case "AI_VISUALIZED":
        return "bg-blue-100 text-blue-700" // AI 시각화됨 - 옅은 파란색
      case "USER_COMPLETED":
        return "bg-green-100 text-green-700" // 사용자 완료 - 초록색
      default:
        return "bg-gray-200 text-gray-700" // 기본값
    }
  }

  return (
    <div className="bg-white h-full w-full">
      <div className="py-4 px-4">
        <h2 className="text-lg font-bold text-gray-800">API 관리</h2>
      </div>
      <div className="overflow-y-auto overflow-x-hidden" style={{ height: "calc(100vh - 179px)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">API 목록을 불러오는 중...</span>
          </div>
        ) : (
          <div className="px-2 py-2 divide-y divide-gray-200">
            {apiGroups.map((group) => (
              <div key={group.id} className="py-2 overflow-hidden px-2">
                <div className="flex justify-between items-center">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 w-full flex-wrap">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 min-w-[100px] border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveGroupName()
                          else if (e.key === "Escape") cancelEditing()
                        }}
                      />
                      <div className="flex gap-1">
                        <button className="text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 text-sm rounded-md transition-colors" onClick={saveGroupName}>
                          저장
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 px-2 py-1 text-sm rounded-md transition-colors" onClick={cancelEditing}>
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <h3
                        className="font-medium cursor-pointer flex-1 text-gray-800 hover:text-blue-500 transition-colors truncate max-w-[160px]"
                        onClick={() => startEditingGroup(group.id)}
                        title={group.name}
                      >
                        {group.name}
                      </h3>
                      <div className="flex items-center">
                        <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0" onClick={() => addApiEndpoint(group.id)} title="엔드포인트 추가">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="p-1 text-red-400 hover:text-red-600 transition-colors flex-shrink-0 ml-1" onClick={() => deleteApiGroup(group.id)} title="그룹 삭제">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <ul className="space-y-1 mt-1">
                  {group.endpoints.map((endpoint) => (
                    <li key={endpoint.id} className="ml-4 overflow-hidden">
                      {editingEndpointId === endpoint.id ? (
                        // 편집 모드 UI
                        <div className="flex items-center gap-1 flex-wrap text-sm">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={newEndpointPath}
                            onChange={(e) => setNewEndpointPath(e.target.value)}
                            className="flex-1 min-w-[100px] border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            onKeyDown={(e) => handleKeyDown(e, group.id)}
                          />

                          <button
                            data-delete-button="true"
                            className="text-red-500 px-1 py-0.5 text-xs rounded hover:bg-red-50 ml-auto flex-shrink-0"
                            onClick={() => deleteApiEndpoint(group.id, endpoint.id)}
                            title="삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        // 일반 모드 UI - HTTP 메서드 표시 추가 및 향상된 UI
                        <div className="flex justify-between items-center rounded-sm hover:bg-gray-50 transition-colors py-1 overflow-hidden">
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                            onClick={() => onApiSelect(endpoint.path, endpoint.method)}
                            onDoubleClick={(e) => startEditingEndpoint(group.id, endpoint.id, e)}
                          >
                            {/* 상태 드롭다운 - UI는 유지하되 값만 변경 */}
                            <div className="relative inline-block text-left w-24 flex-shrink-0">
                              <select
                                value={endpoint.status}
                                onChange={(e) => updateEndpointStatus(group.id, endpoint.id, e.target.value as ApiProcessStateEnumDto)}
                                className={`appearance-none text-xs px-2 py-0.5 rounded w-full cursor-pointer focus:outline-none ${getStatusStyle(endpoint.status)} pr-6`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="AI_GENERATED" className="bg-white text-gray-700">
                                  AI 생성됨
                                </option>
                                <option value="AI_VISUALIZED" className="bg-white text-blue-700">
                                  AI 시각화됨
                                </option>
                                <option value="USER_COMPLETED" className="bg-white text-green-700">
                                  사용자 완료
                                </option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
                                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>

                            {/* 경로 표시 */}
                            <span className="text-sm text-gray-800 hover:text-blue-500 transition-colors truncate" title={endpoint.path}>
                              {endpoint.path.startsWith(group.name)
                                ? endpoint.path.substring(group.name.length) || "/" // 그룹 이름 다음 부분만 표시
                                : endpoint.path}{" "}
                            </span>
                          </div>

                          {/* 점 세개 버튼 - 클릭하면 편집 모드로 전환 */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-sm hover:bg-gray-100 flex-shrink-0"
                              title="편집"
                              onClick={(e) => startEditingEndpoint(group.id, endpoint.id, e)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {apiGroups.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <p>API 그룹이 없습니다. 새 API 그룹을 추가하세요.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-1 px-2 pb-10">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium"
            onClick={addApiGroup}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>API 그룹 추가</span>
          </button>
        </div>
      </div>
    </div>
  )
}
