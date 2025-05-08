"use client"

import { useState } from "react"
import axios from "axios"

// API 스펙 생성 상태 인터페이스
interface CreateApiSpecState {
  endpoint: string
  apiGroup: string
  httpMethod: string
  scrudProjectId: number
  description: string
  summary: string
  requestBody: string
  pathParameters: string
  queryParameters: string
  response: string
}

// API 스펙 수정 상태 인터페이스
interface UpdateApiSpecState {
  endpoint: string
  apiGroup: string
  httpMethod: string
  description: string
  summary: string
  requestBody: string
  pathParameters: string
  queryParameters: string
  response: string
}

// API 응답 인터페이스
interface ApiResponse {
  status: number
  data: Record<string, unknown>
  error?: string
}

export default function ApiTestPage() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState("get-by-project")
  const [projectId, setProjectId] = useState("1")
  const [apiSpecVersionId, setApiSpecVersionId] = useState("1")
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // API 스펙 생성 상태
  const [createApiSpec, setCreateApiSpec] = useState<CreateApiSpecState>({
    endpoint: "/api/v1/examples/{id}",
    apiGroup: "example",
    httpMethod: "POST",
    scrudProjectId: 1,
    description: "API 설명",
    summary: "API 요약",
    requestBody: JSON.stringify({ name: "홍길동" }, null, 2),
    pathParameters: JSON.stringify({ id: "123" }, null, 2),
    queryParameters: JSON.stringify({ page: "1", size: "10" }, null, 2),
    response: JSON.stringify({ data: { id: 123, name: "홍길동" }, message: "성공" }, null, 2),
  })

  // API 스펙 수정 상태
  const [updateApiSpec, setUpdateApiSpec] = useState<UpdateApiSpecState>({
    endpoint: "/api/v1/examples/{id}",
    apiGroup: "example",
    httpMethod: "PUT",
    description: "API 설명 (수정됨)",
    summary: "API 요약 (수정됨)",
    requestBody: JSON.stringify({ name: "김철수" }, null, 2),
    pathParameters: JSON.stringify({ id: "123" }, null, 2),
    queryParameters: JSON.stringify({ page: "1", size: "10" }, null, 2),
    response: JSON.stringify({ data: { id: 123, name: "김철수" }, message: "성공" }, null, 2),
  })

  // API 스펙 필드 변경 핸들러 (생성)
  const handleCreateApiSpecChange = (field: string, value: string) => {
    try {
      // JSON 필드인 경우 유효성 검사
      if (["requestBody", "pathParameters", "queryParameters", "response"].includes(field)) {
        // 빈 문자열이 아닌 경우에만 JSON 파싱 시도
        if (value.trim()) {
          JSON.parse(value)
        }
      }
      setCreateApiSpec({ ...createApiSpec, [field]: value })
    } catch (error) {
      // JSON 파싱 오류는 무시 (사용자가 입력 중일 수 있음)
      console.warn(`Invalid JSON in ${field}:`, error)
    }
  }

  // API 스펙 필드 변경 핸들러 (수정)
  const handleUpdateApiSpecChange = (field: string, value: string) => {
    try {
      // JSON 필드인 경우 유효성 검사
      if (["requestBody", "pathParameters", "queryParameters", "response"].includes(field)) {
        // 빈 문자열이 아닌 경우에만 JSON 파싱 시도
        if (value.trim()) {
          JSON.parse(value)
        }
      }
      setUpdateApiSpec({ ...updateApiSpec, [field]: value })
    } catch (error) {
      // JSON 파싱 오류는 무시 (사용자가 입력 중일 수 있음)
      console.warn(`Invalid JSON in ${field}:`, error)
    }
  }

  // API 테스트 실행 함수
  const runApiTest = async (apiType: string) => {
    setIsLoading(true)
    try {
      // 백엔드 서버 주소
      const backendUrl = "http://localhost:8081" // 백엔드 서버 주소를 여기에 설정
      let response

      switch (apiType) {
        case "get-by-project":
          response = await axios.get(`${backendUrl}/api/v1/api-specs/by-project/${projectId}`)
          break
        case "get-by-id":
          response = await axios.get(`${backendUrl}/api/v1/api-specs/${apiSpecVersionId}`)
          break
        case "create":
          const createPayload = {
            ...createApiSpec,
            scrudProjectId: Number(createApiSpec.scrudProjectId),
          }
          // 값이 있는 JSON 필드만 변환
          if (createApiSpec.requestBody.trim()) {
            createPayload.requestBody = JSON.parse(createApiSpec.requestBody)
          }
          if (createApiSpec.pathParameters.trim()) {
            createPayload.pathParameters = JSON.parse(createApiSpec.pathParameters)
          }
          if (createApiSpec.queryParameters.trim()) {
            createPayload.queryParameters = JSON.parse(createApiSpec.queryParameters)
          }
          if (createApiSpec.response.trim()) {
            createPayload.response = JSON.parse(createApiSpec.response)
          }

          response = await axios.post(`${backendUrl}/api/v1/api-specs`, createPayload)
          break
        case "update":
          const updatePayload = { ...updateApiSpec }
          // 값이 있는 JSON 필드만 변환
          if (updateApiSpec.requestBody.trim()) {
            updatePayload.requestBody = JSON.parse(updateApiSpec.requestBody)
          }
          if (updateApiSpec.pathParameters.trim()) {
            updatePayload.pathParameters = JSON.parse(updateApiSpec.pathParameters)
          }
          if (updateApiSpec.queryParameters.trim()) {
            updatePayload.queryParameters = JSON.parse(updateApiSpec.queryParameters)
          }
          if (updateApiSpec.response.trim()) {
            updatePayload.response = JSON.parse(updateApiSpec.response)
          }

          response = await axios.put(`${backendUrl}/api/v1/api-specs/${apiSpecVersionId}`, updatePayload)
          break
        case "delete":
          response = await axios.delete(`${backendUrl}/api/v1/api-specs/${apiSpecVersionId}`)
          break
        default:
          throw new Error("알 수 없는 API 타입")
      }

      setApiResponse({
        status: response.status,
        data: response.data,
      })
    } catch (error) {
      console.error("API 테스트 오류:", error)
      if (axios.isAxiosError(error)) {
        setApiResponse({
          status: error.response?.status || 500,
          data: {},
          error: error.response?.data?.message || error.message || "알 수 없는 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          data: {},
          error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API 테스트 페이지</h1>

      <div className="mb-4">
        <div className="grid grid-cols-5 mb-4 gap-2">
          <button className={`p-2 border rounded-md ${activeTab === "get-by-project" ? "bg-blue-100 border-blue-500" : "bg-gray-100"}`} onClick={() => setActiveTab("get-by-project")}>
            프로젝트로 조회
          </button>
          <button className={`p-2 border rounded-md ${activeTab === "get-by-id" ? "bg-blue-100 border-blue-500" : "bg-gray-100"}`} onClick={() => setActiveTab("get-by-id")}>
            단일 API 조회
          </button>
          <button className={`p-2 border rounded-md ${activeTab === "create" ? "bg-blue-100 border-blue-500" : "bg-gray-100"}`} onClick={() => setActiveTab("create")}>
            API 스펙 생성
          </button>
          <button className={`p-2 border rounded-md ${activeTab === "update" ? "bg-blue-100 border-blue-500" : "bg-gray-100"}`} onClick={() => setActiveTab("update")}>
            API 스펙 수정
          </button>
          <button className={`p-2 border rounded-md ${activeTab === "delete" ? "bg-blue-100 border-blue-500" : "bg-gray-100"}`} onClick={() => setActiveTab("delete")}>
            API 스펙 삭제
          </button>
        </div>

        {/* 프로젝트로 API 스펙 조회 */}
        {activeTab === "get-by-project" && (
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">프로젝트 ID로 API 스펙 목록 조회</h2>
              <p className="text-gray-600 mb-4">Scrud 프로젝트 ID로 연결된 모든 API 스펙 버전을 조회합니다.</p>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="w-full max-w-sm">
                <label htmlFor="projectId" className="block mb-1 text-sm font-medium">
                  프로젝트 ID
                </label>
                <input id="projectId" className="w-full p-2 border rounded-md" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="프로젝트 ID 입력" />
              </div>
              <button className={`px-4 py-2 rounded-md text-white ${isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`} onClick={() => runApiTest("get-by-project")} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "조회하기"}
              </button>
            </div>
          </div>
        )}

        {/* 단일 API 스펙 조회 */}
        {activeTab === "get-by-id" && (
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">단일 API 스펙 상세 조회</h2>
              <p className="text-gray-600 mb-4">API 스펙 버전 ID로 단일 API 스펙과 관련 필드를 조회합니다.</p>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="w-full max-w-sm">
                <label htmlFor="apiSpecVersionId" className="block mb-1 text-sm font-medium">
                  API 스펙 버전 ID
                </label>
                <input
                  id="apiSpecVersionId"
                  className="w-full p-2 border rounded-md"
                  value={apiSpecVersionId}
                  onChange={(e) => setApiSpecVersionId(e.target.value)}
                  placeholder="API 스펙 버전 ID 입력"
                />
              </div>
              <button className={`px-4 py-2 rounded-md text-white ${isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`} onClick={() => runApiTest("get-by-id")} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "조회하기"}
              </button>
            </div>
          </div>
        )}

        {/* API 스펙 생성 */}
        {activeTab === "create" && (
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">API 스펙 생성</h2>
              <p className="text-gray-600 mb-4">새로운 API 스펙과 필드를 등록합니다.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-endpoint" className="block mb-1 text-sm font-medium">
                    엔드포인트
                  </label>
                  <input
                    id="create-endpoint"
                    className="w-full p-2 border rounded-md"
                    value={createApiSpec.endpoint}
                    onChange={(e) => handleCreateApiSpecChange("endpoint", e.target.value)}
                    placeholder="/api/v1/examples/{id}"
                  />
                </div>
                <div>
                  <label htmlFor="create-apiGroup" className="block mb-1 text-sm font-medium">
                    API 그룹
                  </label>
                  <input
                    id="create-apiGroup"
                    className="w-full p-2 border rounded-md"
                    value={createApiSpec.apiGroup}
                    onChange={(e) => handleCreateApiSpecChange("apiGroup", e.target.value)}
                    placeholder="example"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="create-httpMethod" className="block mb-1 text-sm font-medium">
                    HTTP 메소드
                  </label>
                  <select id="create-httpMethod" className="w-full p-2 border rounded-md" value={createApiSpec.httpMethod} onChange={(e) => handleCreateApiSpecChange("httpMethod", e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="create-scrudProjectId" className="block mb-1 text-sm font-medium">
                    Scrud 프로젝트 ID
                  </label>
                  <input
                    id="create-scrudProjectId"
                    className="w-full p-2 border rounded-md"
                    value={String(createApiSpec.scrudProjectId)}
                    onChange={(e) => handleCreateApiSpecChange("scrudProjectId", e.target.value)}
                    placeholder="1"
                    type="number"
                  />
                </div>
                <div>
                  <label htmlFor="create-summary" className="block mb-1 text-sm font-medium">
                    요약
                  </label>
                  <input
                    id="create-summary"
                    className="w-full p-2 border rounded-md"
                    value={createApiSpec.summary}
                    onChange={(e) => handleCreateApiSpecChange("summary", e.target.value)}
                    placeholder="API 요약"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-description" className="block mb-1 text-sm font-medium">
                  설명
                </label>
                <textarea
                  id="create-description"
                  className="w-full p-2 border rounded-md"
                  value={createApiSpec.description}
                  onChange={(e) => handleCreateApiSpecChange("description", e.target.value)}
                  placeholder="API 설명"
                  rows={2}
                />
              </div>

              <div className="border rounded-md">
                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-md">Request Body</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={createApiSpec.requestBody}
                      onChange={(e) => handleCreateApiSpecChange("requestBody", e.target.value)}
                      placeholder="요청 바디 JSON"
                      rows={5}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100">Path Parameters</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={createApiSpec.pathParameters}
                      onChange={(e) => handleCreateApiSpecChange("pathParameters", e.target.value)}
                      placeholder="경로 파라미터 JSON"
                      rows={3}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100">Query Parameters</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={createApiSpec.queryParameters}
                      onChange={(e) => handleCreateApiSpecChange("queryParameters", e.target.value)}
                      placeholder="쿼리 파라미터 JSON"
                      rows={3}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-b-md">Response</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={createApiSpec.response}
                      onChange={(e) => handleCreateApiSpecChange("response", e.target.value)}
                      placeholder="응답 JSON"
                      rows={5}
                    />
                  </div>
                </details>
              </div>
            </div>
            <div className="mt-4">
              <button className={`w-full py-2 text-white rounded-md ${isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`} onClick={() => runApiTest("create")} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "API 스펙 생성하기"}
              </button>
            </div>
          </div>
        )}

        {/* API 스펙 수정 */}
        {activeTab === "update" && (
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">API 스펙 수정</h2>
              <p className="text-gray-600 mb-4">API 스펙 버전 ID로 API 스펙과 관련 필드를 수정합니다.</p>
            </div>
            <div className="mb-4">
              <div className="w-full max-w-sm">
                <label htmlFor="update-apiSpecVersionId" className="block mb-1 text-sm font-medium">
                  API 스펙 버전 ID
                </label>
                <input
                  id="update-apiSpecVersionId"
                  className="w-full p-2 border rounded-md"
                  value={apiSpecVersionId}
                  onChange={(e) => setApiSpecVersionId(e.target.value)}
                  placeholder="API 스펙 버전 ID 입력"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="update-endpoint" className="block mb-1 text-sm font-medium">
                    엔드포인트
                  </label>
                  <input
                    id="update-endpoint"
                    className="w-full p-2 border rounded-md"
                    value={updateApiSpec.endpoint}
                    onChange={(e) => handleUpdateApiSpecChange("endpoint", e.target.value)}
                    placeholder="/api/v1/examples/{id}"
                  />
                </div>
                <div>
                  <label htmlFor="update-apiGroup" className="block mb-1 text-sm font-medium">
                    API 그룹
                  </label>
                  <input
                    id="update-apiGroup"
                    className="w-full p-2 border rounded-md"
                    value={updateApiSpec.apiGroup}
                    onChange={(e) => handleUpdateApiSpecChange("apiGroup", e.target.value)}
                    placeholder="example"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="update-httpMethod" className="block mb-1 text-sm font-medium">
                    HTTP 메소드
                  </label>
                  <select id="update-httpMethod" className="w-full p-2 border rounded-md" value={updateApiSpec.httpMethod} onChange={(e) => handleUpdateApiSpecChange("httpMethod", e.target.value)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="update-summary" className="block mb-1 text-sm font-medium">
                    요약
                  </label>
                  <input
                    id="update-summary"
                    className="w-full p-2 border rounded-md"
                    value={updateApiSpec.summary}
                    onChange={(e) => handleUpdateApiSpecChange("summary", e.target.value)}
                    placeholder="API 요약"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="update-description" className="block mb-1 text-sm font-medium">
                  설명
                </label>
                <textarea
                  id="update-description"
                  className="w-full p-2 border rounded-md"
                  value={updateApiSpec.description}
                  onChange={(e) => handleUpdateApiSpecChange("description", e.target.value)}
                  placeholder="API 설명"
                  rows={2}
                />
              </div>

              <div className="border rounded-md">
                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-md">Request Body</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={updateApiSpec.requestBody}
                      onChange={(e) => handleUpdateApiSpecChange("requestBody", e.target.value)}
                      placeholder="요청 바디 JSON"
                      rows={5}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100">Path Parameters</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={updateApiSpec.pathParameters}
                      onChange={(e) => handleUpdateApiSpecChange("pathParameters", e.target.value)}
                      placeholder="경로 파라미터 JSON"
                      rows={3}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100">Query Parameters</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={updateApiSpec.queryParameters}
                      onChange={(e) => handleUpdateApiSpecChange("queryParameters", e.target.value)}
                      placeholder="쿼리 파라미터 JSON"
                      rows={3}
                    />
                  </div>
                </details>

                <details className="w-full">
                  <summary className="p-3 font-medium cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-b-md">Response</summary>
                  <div className="p-3">
                    <textarea
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={updateApiSpec.response}
                      onChange={(e) => handleUpdateApiSpecChange("response", e.target.value)}
                      placeholder="응답 JSON"
                      rows={5}
                    />
                  </div>
                </details>
              </div>
            </div>
            <div className="mt-4">
              <button className={`w-full py-2 text-white rounded-md ${isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`} onClick={() => runApiTest("update")} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "API 스펙 수정하기"}
              </button>
            </div>
          </div>
        )}

        {/* API 스펙 삭제 */}
        {activeTab === "delete" && (
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">API 스펙 삭제</h2>
              <p className="text-gray-600 mb-4">API 스펙 버전 ID로 단일 API 스펙과 관련 필드를 삭제합니다.</p>
            </div>
            <div className="flex items-end gap-4 mb-4">
              <div className="w-full max-w-sm">
                <label htmlFor="delete-apiSpecVersionId" className="block mb-1 text-sm font-medium">
                  API 스펙 버전 ID
                </label>
                <input
                  id="delete-apiSpecVersionId"
                  className="w-full p-2 border rounded-md"
                  value={apiSpecVersionId}
                  onChange={(e) => setApiSpecVersionId(e.target.value)}
                  placeholder="API 스펙 버전 ID 입력"
                />
              </div>
              <button className={`px-4 py-2 rounded-md text-white ${isLoading ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"}`} onClick={() => runApiTest("delete")} disabled={isLoading}>
                {isLoading ? "로딩 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API 응답 결과 */}
      {apiResponse && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">API 응답 결과</h2>
          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="mb-2">
              <span className="font-bold">상태 코드: </span>
              <span className={`${apiResponse.status >= 200 && apiResponse.status < 300 ? "text-green-600" : "text-red-600"}`}>{apiResponse.status}</span>
            </div>

            {apiResponse.error ? (
              <div className="text-red-600">
                <span className="font-bold">오류: </span>
                {apiResponse.error}
              </div>
            ) : (
              <pre className="overflow-x-auto p-2 rounded bg-gray-200 font-mono text-sm">{JSON.stringify(apiResponse.data, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
