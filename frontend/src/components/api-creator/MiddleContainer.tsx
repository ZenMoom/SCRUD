"use client"

import { useState } from "react"

interface ApiEndpoint {
  id: string
  path: string
  method: string
  isComplete: boolean // API 완성 여부
}

interface ApiGroup {
  id: string
  name: string
  endpoints: ApiEndpoint[]
}

interface MiddleContainerProps {
  onApiSelect: (apiPath: string) => void
}

export default function MiddleContainer({ onApiSelect }: MiddleContainerProps) {
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>([
    {
      id: "ooo",
      name: "api/OOO",
      endpoints: [{ id: "ooo-xxx", path: "api/OOO/XXX", method: "GET", isComplete: false }],
    },
    {
      id: "user",
      name: "api/user",
      endpoints: [
        { id: "user-me", path: "api/user/me", method: "GET", isComplete: true },
        { id: "user-login", path: "api/user/login", method: "POST", isComplete: true },
        { id: "user-logout", path: "api/user/logout", method: "POST", isComplete: false },
      ],
    },
    {
      id: "post",
      name: "api/post",
      endpoints: [
        { id: "post-send", path: "api/post/send", method: "POST", isComplete: true },
        { id: "post-delete", path: "api/post/delete", method: "DELETE", isComplete: false },
        { id: "post-update", path: "api/post/update", method: "PUT", isComplete: false },
      ],
    },
  ])

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null)
  const [activeMenuEndpointId, setActiveMenuEndpointId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newEndpointPath, setNewEndpointPath] = useState("")
  const [newEndpointMethod, setNewEndpointMethod] = useState("GET")
  const [newEndpointIsComplete, setNewEndpointIsComplete] = useState(false)

  // API 그룹 추가 함수
  const addApiGroup = () => {
    const newGroupId = `group-${Date.now()}`
    setApiGroups([
      ...apiGroups,
      {
        id: newGroupId,
        name: "api/NEW",
        endpoints: [],
      },
    ])
    setEditingGroupId(newGroupId)
    setNewGroupName("api/NEW")
  }

  // API 엔드포인트 추가 함수
  const addApiEndpoint = (groupId: string) => {
    const group = apiGroups.find((g) => g.id === groupId)
    if (!group) return

    const newEndpointId = `${groupId}-endpoint-${Date.now()}`
    const basePath = group.name
    const newEndpoint = {
      id: newEndpointId,
      path: `${basePath}/new`,
      method: "GET",
      isComplete: false,
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
    setNewEndpointMethod("GET")
    setNewEndpointIsComplete(false)
  }

  // API 그룹 삭제 함수
  const deleteApiGroup = (groupId: string) => {
    if (confirm("이 API 그룹을 삭제하시겠습니까?")) {
      setApiGroups(apiGroups.filter((group) => group.id !== groupId))
    }
  }

  // API 엔드포인트 삭제 함수
  const deleteApiEndpoint = (groupId: string, endpointId: string) => {
    if (confirm("이 API 엔드포인트를 삭제하시겠습니까?")) {
      setApiGroups(
        apiGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              endpoints: group.endpoints.filter((endpoint) => endpoint.id !== endpointId),
            }
          }
          return group
        })
      )
    }
    setActiveMenuEndpointId(null) // 메뉴 닫기
  }

  // API 완성 상태 토글
  const toggleApiComplete = (groupId: string, endpointId: string) => {
    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.map((endpoint) => {
              if (endpoint.id === endpointId) {
                return {
                  ...endpoint,
                  isComplete: !endpoint.isComplete,
                }
              }
              return endpoint
            }),
          }
        }
        return group
      })
    )
    setActiveMenuEndpointId(null) // 메뉴 닫기
  }

  // API 그룹 이름 편집 시작
  const startEditingGroup = (groupId: string) => {
    const group = apiGroups.find((g) => g.id === groupId)
    if (group) {
      setEditingGroupId(groupId)
      setNewGroupName(group.name)
    }
  }

  // API 엔드포인트 편집 시작
  const startEditingEndpoint = (groupId: string, endpointId: string) => {
    const group = apiGroups.find((g) => g.id === groupId)
    const endpoint = group?.endpoints.find((e) => e.id === endpointId)

    if (endpoint) {
      setEditingEndpointId(endpointId)
      setNewEndpointPath(endpoint.path)
      setNewEndpointMethod(endpoint.method)
      setNewEndpointIsComplete(endpoint.isComplete)
      setActiveMenuEndpointId(null) // 메뉴 닫기
    }
  }

  // API 그룹 이름 저장
  const saveGroupName = () => {
    if (!editingGroupId || !newGroupName.trim()) return

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
  const saveEndpoint = () => {
    if (!editingEndpointId || !newEndpointPath.trim()) return

    setApiGroups(
      apiGroups.map((group) => {
        const endpointIndex = group.endpoints.findIndex((e) => e.id === editingEndpointId)

        if (endpointIndex >= 0) {
          const updatedEndpoints = [...group.endpoints]
          updatedEndpoints[endpointIndex] = {
            ...updatedEndpoints[endpointIndex],
            path: newEndpointPath,
            method: newEndpointMethod,
            isComplete: newEndpointIsComplete,
          }

          return {
            ...group,
            endpoints: updatedEndpoints,
          }
        }
        return group
      })
    )

    setEditingEndpointId(null)
  }

  // 편집 취소
  const cancelEditing = () => {
    setEditingGroupId(null)
    setEditingEndpointId(null)
  }

  // 메뉴 토글 함수
  const toggleMenu = (endpointId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 상위 요소 클릭 이벤트 방지
    setActiveMenuEndpointId(activeMenuEndpointId === endpointId ? null : endpointId)
  }

  // 문서 클릭시 메뉴 닫기 이벤트 리스너 추가
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     setActiveMenuEndpointId(null)
  //   }
  //   document.addEventListener('mousedown', handleClickOutside)
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside)
  //   }
  // }, [])

  return (
    <div className="bg-white h-full w-full">
      <div className="py-4 px-4">
        <h2 className="text-lg font-bold text-gray-800">API 관리</h2>
      </div>
      <div className="overflow-y-auto overflow-x-hidden" style={{ height: "calc(100vh - 179px)" }}>
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
                      <div className="flex items-center gap-1 flex-wrap text-sm">
                        <select
                          value={newEndpointMethod}
                          onChange={(e) => setNewEndpointMethod(e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0"
                        >
                          <option>GET</option>
                          <option>POST</option>
                          <option>PUT</option>
                          <option>DELETE</option>
                        </select>
                        <input
                          type="text"
                          value={newEndpointPath}
                          onChange={(e) => setNewEndpointPath(e.target.value)}
                          className="flex-1 min-w-[100px] border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          autoFocus
                        />
                        <div className="flex items-center flex-shrink-0">
                          <label className="inline-flex items-center cursor-pointer mr-1">
                            <input type="checkbox" checked={newEndpointIsComplete} onChange={() => setNewEndpointIsComplete(!newEndpointIsComplete)} className="sr-only peer" />
                            <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button className="text-green-600 px-1 py-0.5 text-xs rounded hover:bg-green-50" onClick={saveEndpoint}>
                            저장
                          </button>
                          <button className="text-gray-600 px-1 py-0.5 text-xs rounded hover:bg-gray-50" onClick={cancelEditing}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center rounded-sm hover:bg-gray-50 transition-colors py-1 overflow-hidden">
                        <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => onApiSelect(endpoint.path)}>
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${endpoint.isComplete ? "bg-green-500" : "bg-red-500"}`} title={endpoint.isComplete ? "완성" : "미완성"}></span>
                          <span className="text-sm text-gray-800 hover:text-blue-500 transition-colors truncate" title={endpoint.path}>
                            {endpoint.path}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              endpoint.method === "GET"
                                ? "bg-green-100 text-green-700"
                                : endpoint.method === "POST"
                                ? "bg-blue-100 text-blue-700"
                                : endpoint.method === "PUT"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="relative">
                            <button
                              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-sm hover:bg-gray-100 flex-shrink-0"
                              title="더 보기"
                              onClick={(e) => toggleMenu(endpoint.id, e)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>

                            {activeMenuEndpointId === endpoint.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                <ul className="py-1 text-sm text-gray-700">
                                  <li>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        startEditingEndpoint(group.id, endpoint.id)
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      수정
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleApiComplete(group.id, endpoint.id)
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      {endpoint.isComplete ? "미완성으로 표시" : "완성으로 표시"}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteApiEndpoint(group.id, endpoint.id)
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      삭제
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-start mt-4 px-2 pb-4">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm text-sm ml-2" onClick={addApiGroup}>
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
