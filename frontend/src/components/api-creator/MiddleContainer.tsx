// components/api-creator/MiddleContainer.tsx
"use client"

import { useState } from "react"

interface ApiEndpoint {
  id: string
  path: string
  method: string
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
      endpoints: [{ id: "ooo-xxx", path: "api/OOO/XXX", method: "GET" }],
    },
    {
      id: "user",
      name: "api/user",
      endpoints: [
        { id: "user-me", path: "api/user/me", method: "GET" },
        { id: "user-login", path: "api/user/login", method: "POST" },
        { id: "user-logout", path: "api/user/logout", method: "POST" },
      ],
    },
    {
      id: "post",
      name: "api/post",
      endpoints: [
        { id: "post-send", path: "api/post/send", method: "POST" },
        { id: "post-delete", path: "api/post/delete", method: "DELETE" },
        { id: "post-update", path: "api/post/update", method: "PUT" },
      ],
    },
  ])

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newEndpointPath, setNewEndpointPath] = useState("")
  const [newEndpointMethod, setNewEndpointMethod] = useState("GET")

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

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full">
      <h2 className="text-lg font-bold mb-4 border-b pb-2">API 관리</h2>
      <div className="space-y-4">
        {apiGroups.map((group) => (
          <div key={group.id} className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="flex-1 border rounded px-2 py-1" autoFocus />
                  <button className="text-green-600 px-2" onClick={saveGroupName}>
                    저장
                  </button>
                  <button className="text-gray-600 px-2" onClick={cancelEditing}>
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <h3 className="font-medium cursor-pointer flex-1" onClick={() => startEditingGroup(group.id)}>
                    {group.name}
                  </h3>
                  <button className="rounded-full bg-gray-100 p-1" onClick={() => addApiEndpoint(group.id)} title="엔드포인트 추가">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="text-red-500 p-1" onClick={() => deleteApiGroup(group.id)} title="그룹 삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {group.endpoints.map((endpoint) => (
                <li key={endpoint.id} className="ml-4">
                  {editingEndpointId === endpoint.id ? (
                    <div className="flex items-center gap-2">
                      <select value={newEndpointMethod} onChange={(e) => setNewEndpointMethod(e.target.value)} className="border rounded px-2 py-1">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                      <input type="text" value={newEndpointPath} onChange={(e) => setNewEndpointPath(e.target.value)} className="flex-1 border rounded px-2 py-1" autoFocus />
                      <button className="text-green-600 px-2" onClick={saveEndpoint}>
                        저장
                      </button>
                      <button className="text-gray-600 px-2" onClick={cancelEditing}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => startEditingEndpoint(group.id, endpoint.id)}>
                        <span
                          className={`h-3 w-3 rounded-full ${
                            endpoint.method === "GET" ? "bg-green-400" : endpoint.method === "POST" ? "bg-blue-400" : endpoint.method === "PUT" ? "bg-yellow-400" : "bg-red-400"
                          }`}
                        ></span>
                        <span>{endpoint.path}</span>
                      </div>
                      <div className="flex items-center">
                        <button className="text-blue-500 px-2" onClick={() => onApiSelect(endpoint.path)} title="API 선택">
                          선택
                        </button>
                        <button className="text-red-500 px-2" onClick={() => deleteApiEndpoint(group.id, endpoint.id)} title="엔드포인트 삭제">
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex justify-center">
          <button className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors" onClick={addApiGroup} title="API 그룹 추가">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
