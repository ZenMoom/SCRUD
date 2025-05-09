"use client"

import { useState, useEffect, useCallback } from "react"
import axios, { AxiosError } from "axios"
import { ApiSpecVersionResponse, ApiSpecVersionListResponse, ApiSpecVersionCreatedResponse } from "@generated/model"

interface BodyParam {
  key: string
  value: string
}

interface ApiResponseData {
  status: number
  data?: unknown
  error?: string
}

interface RightContainerProps {
  selectedApi: string | null
  selectedMethod: string | null
  onToggleVersionPanel: () => void
  scrudProjectId: number
  onScrudProjectIdChange: (id: number) => void
  onApiSpecChanged: () => void
}

export default function RightContainer({ selectedApi, selectedMethod }: RightContainerProps) {
  const [method, setMethod] = useState<string>("GET")
  const [endpoint, setEndpoint] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [apiSpecVersionId, setApiSpecVersionId] = useState<number | null>(null)
  const [scrudProjectId, setScrudProjectId] = useState<number>(1) // 기본값 설정

  // API 스펙 목록 상태 추가
  const [apiSpecsList, setApiSpecsList] = useState<ApiSpecVersionResponse[]>([])
  const [showSpecsList, setShowSpecsList] = useState<boolean>(false)

  const [bodyParams, setBodyParams] = useState<BodyParam[]>([{ key: "", value: "" }])

  const [activeTab, setActiveTab] = useState<string>("Body")
  const [apiResponse, setApiResponse] = useState<ApiResponseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Postman 스타일 Body 관련 상태 추가
  const [bodyMode, setBodyMode] = useState<"none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary">("raw")
  const [rawBodyFormat, setRawBodyFormat] = useState<"json" | "text" | "xml" | "javascript" | "html">("json")
  const [rawBody, setRawBody] = useState<string>('{\n  "key": "value"\n}')

  // Path 및 Query 파라미터 상태
  const [pathParamsJson, setPathParamsJson] = useState<string>('{ "id": "123" }')
  const [queryParamsJson, setQueryParamsJson] = useState<string>('{ "page": "1", "size": "10" }')

  // 응답 예시
  const [responseJson, setResponseJson] = useState<string>('{\n  "data": {},\n  "message": "성공"\n}')

  // 바디 타입별 콘텐츠 타입 매핑
  const contentTypeMap: Record<string, string> = {
    json: "application/json",
    text: "text/plain",
    xml: "application/xml",
    javascript: "application/javascript",
    html: "text/html",
  }

  // selectedApi와 selectedMethod가 변경될 때마다 호출되는 효과
  useEffect(() => {
    if (selectedApi) {
      setEndpoint(selectedApi)

      // selectedMethod가 있으면 해당 메서드로 설정
      if (selectedMethod) {
        setMethod(selectedMethod)
      }

      // API 경로에 따른 설명 설정
      if (selectedApi.includes("/user/me")) {
        setDescription("현재 인증된 사용자의 개인 정보를 조회하는 API")
        setSummary("사용자 정보 조회")

        // 경로 파라미터 예시
        if (selectedApi.includes("{")) {
          setPathParamsJson('{ "userId": "123" }')
        }

        // GET 메서드는 기본적으로 body가 없음
        if (selectedMethod === "GET") {
          setBodyMode("none")
          setQueryParamsJson('{ "fields": "name,email,profile" }')
        } else {
          // POST/PUT은 JSON 바디 예시 설정
          setRawBody('{\n  "name": "홍길동",\n  "email": "user@example.com"\n}')
        }
      } else if (selectedApi.includes("/user/login")) {
        setDescription("사용자 로그인 API")
        setSummary("로그인")
        setRawBody('{\n  "username": "user@example.com",\n  "password": "password123"\n}')
      } else if (selectedApi.includes("/user/logout")) {
        setDescription("사용자 로그아웃 API")
        setSummary("로그아웃")
      } else if (selectedApi.includes("/post/send")) {
        setDescription("게시물 전송 API")
        setSummary("게시물 전송")
        setRawBody('{\n  "title": "새 게시물",\n  "content": "게시물 내용입니다."\n}')
      } else if (selectedApi.includes("/post/delete")) {
        setDescription("게시물 삭제 API")
        setSummary("게시물 삭제")
        setRawBody('{\n  "postId": 123\n}')
      } else if (selectedApi.includes("/post/update")) {
        setDescription("게시물 수정 API")
        setSummary("게시물 수정")
        setRawBody('{\n  "postId": 123,\n  "title": "수정된 제목",\n  "content": "수정된 내용"\n}')
      } else {
        // 기본 설정
        setDescription("")
        setSummary(selectedApi.split("/").pop() || "API")
      }

      // GET 메서드인 경우 body mode를 none으로 설정
      if (selectedMethod === "GET") {
        setBodyMode("none")
      } else {
        setBodyMode("raw")
        setRawBodyFormat("json")
      }

      // 새 API 선택 시 ID 초기화
      setApiSpecVersionId(null)
    }
  }, [selectedApi, selectedMethod])

  // 프로젝트별 API 스펙 목록 조회 - useCallback으로 감싸기
  const fetchApiSpecsByProject = useCallback(async (projectId: number): Promise<ApiSpecVersionResponse[]> => {
    setIsLoading(true)
    try {
      // Next.js API 라우트로 요청 (직접 백엔드 API 호출하지 않음)
      const response = await axios.get<ApiSpecVersionListResponse>(`/api/api-specs/by-project/${projectId}`)

      // 응답 처리
      const specsList = response.data.content || []
      setApiSpecsList(specsList)
      return specsList

      // 목록 상태 업데이트
      setApiSpecsList(specsList)

      return specsList
    } catch (error) {
      const err = error as Error | AxiosError
      console.error("API 스펙 목록 조회 오류:", err)

      if (axios.isAxiosError(err) && err.response) {
        alert(`오류: ${err.response.data?.error || "API 스펙 목록 조회 중 오류가 발생했습니다."}`)
      } else {
        alert("API 스펙 목록 조회 중 오류가 발생했습니다.")
      }

      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 프로젝트 ID가 변경될 때 API 스펙 목록 가져오기
  useEffect(() => {
    if (scrudProjectId > 0) {
      fetchApiSpecsByProject(scrudProjectId).catch((err) => console.error("API 스펙 목록 조회 오류:", err))
    }
  }, [scrudProjectId, fetchApiSpecsByProject])

  // API 스펙 상세 조회 핸들러
  const handleFetchApi = async (id: number) => {
    setIsLoading(true)
    try {
      // Next.js API 라우트로 요청
      const response = await axios.get<ApiSpecVersionResponse>(`/api/api-specs/${id}`)

      const apiData = response.data

      // 조회 결과로 폼 채우기
      setApiSpecVersionId(apiData.apiSpecVersionId || null)
      setEndpoint(apiData.endpoint || "")
      setMethod(apiData.httpMethod || "GET")
      setDescription(apiData.description || "")
      setSummary(apiData.summary || "")

      // 경로 파라미터 설정
      if (apiData.pathParameters) {
        setPathParamsJson(apiData.pathParameters)
      } else {
        setPathParamsJson('{ "id": "123" }')
      }

      // 쿼리 파라미터 설정
      if (apiData.queryParameters) {
        setQueryParamsJson(apiData.queryParameters)
      } else {
        setQueryParamsJson('{ "page": "1", "size": "10" }')
      }

      // 요청 본문 설정
      if (apiData.requestBody) {
        setRawBody(apiData.requestBody)
        setBodyMode("raw")
        setRawBodyFormat("json")
      } else if (apiData.httpMethod === "GET") {
        setBodyMode("none")
      } else {
        setBodyMode("raw")
        setRawBodyFormat("json")
        setRawBody('{\n  "key": "value"\n}')
      }

      // 응답 형식 설정
      if (apiData.response) {
        setResponseJson(apiData.response)
      } else {
        setResponseJson('{\n  "data": {},\n  "message": "성공"\n}')
      }

      setApiResponse({
        status: 200,
        data: apiData,
      })
    } catch (error) {
      console.error("API 조회 오류:", error)
      const err = error as Error | AxiosError

      if (axios.isAxiosError(err) && err.response) {
        setApiResponse({
          status: err.response.status,
          error: err.response.data?.error || "API 조회 중 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          error: "API 조회 중 오류가 발생했습니다.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // API 스펙 목록에서 특정 스펙 선택
  const selectApiSpec = (spec: ApiSpecVersionResponse) => {
    if (spec.apiSpecVersionId) {
      // handleFetchApi 함수 호출하여 상세 정보 가져오기
      handleFetchApi(spec.apiSpecVersionId)
    } else {
      // apiSpecVersionId가 없는 경우 기본 정보만 설정
      setApiSpecVersionId(null)
      setEndpoint(spec.endpoint || "")
      setMethod(spec.httpMethod || "GET")
      setDescription(spec.description || "")
      setSummary(spec.summary || "")

      // 기타 설정...
    }

    // 목록 닫기
    setShowSpecsList(false)
  }

  // API 생성 또는 업데이트 핸들러
  const handleSaveApi = async () => {
    if (!endpoint.trim()) {
      alert("API 엔드포인트를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      // 요청 본문 데이터 준비
      let requestBodyJson: string | null = null
      if (bodyMode === "raw" && rawBodyFormat === "json" && method !== "GET") {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(rawBody)
          requestBodyJson = rawBody
        } catch (err) {
          console.error("JSON 형식이 올바르지 않습니다.", err)
          setIsLoading(false)
          return
        }
      } else if (bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") {
        const formData: Record<string, string> = {}
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            formData[param.key] = param.value
          }
        })
        requestBodyJson = JSON.stringify(formData)
      }

      // 경로 파라미터 검증
      let pathParametersJson: string | null = null
      if (endpoint.includes("{")) {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(pathParamsJson)
          pathParametersJson = pathParamsJson
        } catch (err) {
          console.error("경로 파라미터 JSON 형식이 올바르지 않습니다.", err)
          setIsLoading(false)
          return
        }
      }

      // 쿼리 파라미터 검증
      let queryParametersJson: string | null = null
      if (method === "GET") {
        try {
          // 유효한 JSON인지 확인
          JSON.parse(queryParamsJson)
          queryParametersJson = queryParamsJson
        } catch (err) {
          console.error("쿼리 파라미터 JSON 형식이 올바르지 않습니다.", err)
          setIsLoading(false)
          return
        }
      }

      // 응답 JSON 검증
      let responseJsonValue: string | null = null
      try {
        // 유효한 JSON인지 확인
        JSON.parse(responseJson)
        responseJsonValue = responseJson
      } catch (err) {
        console.error("응답 JSON 형식이 올바르지 않습니다.", err)
        setIsLoading(false)
        return
      }

      // API 스펙 데이터 생성
      const apiSpecData = {
        endpoint,
        summary: summary || endpoint.split("/").pop() || "API",
        description: description || "",
        httpMethod: method,
        scrudProjectId,
      } as Record<string, unknown>

      // 선택적 필드 추가
      if (requestBodyJson && method !== "GET") {
        apiSpecData["requestBody"] = requestBodyJson
      }

      if (pathParametersJson) {
        apiSpecData["pathParameters"] = pathParametersJson
      }

      if (queryParametersJson && method === "GET") {
        apiSpecData["queryParameters"] = queryParametersJson
      }

      if (responseJsonValue) {
        apiSpecData["response"] = responseJsonValue
      }

      let response

      // 기존 API 수정 또는 새 API 생성
      if (apiSpecVersionId) {
        // API 스펙 수정 (Next.js API 라우트로 요청)
        response = await axios.put<ApiSpecVersionResponse>(`/api/api-specs/${apiSpecVersionId}`, apiSpecData)
      } else {
        // API 스펙 생성 (Next.js API 라우트로 요청)
        response = await axios.post<ApiSpecVersionCreatedResponse>("/api/api-specs", apiSpecData)
      }

      // 응답 처리
      setApiResponse({
        status: response.status,
        data: response.data,
      })

      // API ID 설정 (향후 업데이트에 사용)
      if (response.data?.apiSpecVersionId) {
        setApiSpecVersionId(response.data.apiSpecVersionId)
      }

      // 저장 후 목록 새로고침
      await fetchApiSpecsByProject(scrudProjectId)

      alert(`API가 성공적으로 ${apiSpecVersionId ? "수정" : "생성"}되었습니다: ${method} ${endpoint}`)
    } catch (error) {
      console.error("API 생성/수정 오류:", error)
      const err = error as Error | AxiosError

      // 오류 응답 처리
      if (axios.isAxiosError(err) && err.response) {
        setApiResponse({
          status: err.response.status,
          error: err.response.data?.error || "API 생성/수정 중 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          error: "API 생성/수정 중 오류가 발생했습니다.",
        })
      }

      alert(`오류: ${err.message || "알 수 없는 오류가 발생했습니다."}`)
    } finally {
      setIsLoading(false)
    }
  }

  // API 삭제 핸들러
  const handleDeleteApi = async () => {
    if (!apiSpecVersionId) {
      alert("삭제할 API가 없습니다.")
      return
    }

    if (!confirm("정말로 이 API를 삭제하시겠습니까?")) {
      return
    }

    setIsLoading(true)
    try {
      // API 스펙 삭제 요청 (Next.js API 라우트로 요청)
      const response = await axios.delete(`/api/api-specs/${apiSpecVersionId}`)

      setApiResponse({
        status: response.status,
        data: response.data,
      })

      // 폼 초기화
      setApiSpecVersionId(null)
      setEndpoint("")
      setDescription("")
      setSummary("")
      setRawBody('{\n  "key": "value"\n}')
      setPathParamsJson('{ "id": "123" }')
      setQueryParamsJson('{ "page": "1", "size": "10" }')
      setResponseJson('{\n  "data": {},\n  "message": "성공"\n}')

      // 삭제 후 목록 새로고침
      await fetchApiSpecsByProject(scrudProjectId)

      alert(`API가 성공적으로 삭제되었습니다.`)
    } catch (error) {
      console.error("API 삭제 오류:", error)
      const err = error as Error | AxiosError

      if (axios.isAxiosError(err) && err.response) {
        setApiResponse({
          status: err.response.status,
          error: err.response.data?.error || "API 삭제 중 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          error: "API 삭제 중 오류가 발생했습니다.",
        })
      }

      alert(`오류: ${err.message || "알 수 없는 오류가 발생했습니다."}`)
    } finally {
      setIsLoading(false)
    }
  }

  // API 테스트 실행
  const handleTestApi = async () => {
    if (!endpoint.trim()) {
      alert("API 엔드포인트를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      // Body 모드에 따라 다른 요청 데이터 구성
      let requestBodyData: string | Record<string, unknown> | FormData | null = null
      const headers: Record<string, string> = {}

      if (bodyMode === "raw") {
        if (rawBodyFormat === "json") {
          try {
            requestBodyData = JSON.parse(rawBody)
            headers["Content-Type"] = "application/json"
          } catch (err) {
            console.error("JSON 형식이 올바르지 않습니다.", err)
            setIsLoading(false)
            return
          }
        } else {
          requestBodyData = rawBody
          headers["Content-Type"] = contentTypeMap[rawBodyFormat]
        }
      } else if (bodyMode === "form-data") {
        const formData = new FormData()
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            formData.append(param.key, param.value)
          }
        })
        requestBodyData = formData
      } else if (bodyMode === "x-www-form-urlencoded") {
        const urlEncoded = new URLSearchParams()
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            urlEncoded.append(param.key, param.value)
          }
        })
        requestBodyData = urlEncoded.toString()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
      }

      // 쿼리 파라미터 구성
      let finalEndpoint = endpoint
      if (method === "GET" && queryParamsJson) {
        try {
          const queryParams = JSON.parse(queryParamsJson)
          const queryString = Object.entries(queryParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join("&")

          if (queryString) {
            finalEndpoint += `?${queryString}`
          }
        } catch (err) {
          console.error("쿼리 파라미터 파싱 오류", err)
        }
      }

      // 경로 파라미터 대체
      if (endpoint.includes("{") && pathParamsJson) {
        try {
          const pathParams = JSON.parse(pathParamsJson)
          let processedEndpoint = finalEndpoint

          // 경로의 {parameter} 부분을 실제 값으로 대체
          Object.entries(pathParams).forEach(([key, value]) => {
            processedEndpoint = processedEndpoint.replace(`{${key}}`, String(value))
          })

          finalEndpoint = processedEndpoint
        } catch (err) {
          console.error("경로 파라미터 파싱 오류", err)
        }
      }

      // 백엔드 서버 요청을 Next.js API 라우트로 프록시
      const testApiUrl = `/api/test${finalEndpoint}`
      let response

      switch (method) {
        case "GET":
          response = await axios.get(testApiUrl, { headers })
          break
        case "POST":
          response = await axios.post(testApiUrl, requestBodyData, { headers })
          break
        case "PUT":
          response = await axios.put(testApiUrl, requestBodyData, { headers })
          break
        case "DELETE":
          response = await axios.delete(testApiUrl, {
            data: requestBodyData,
            headers,
          })
          break
        default:
          throw new Error("지원하지 않는 HTTP 메소드입니다.")
      }

      setApiResponse({
        status: response.status,
        data: response.data,
      })
    } catch (error) {
      console.error("API 테스트 오류:", error)
      const err = error as Error | AxiosError

      if (axios.isAxiosError(err) && err.response) {
        setApiResponse({
          status: err.response.status,
          error: err.response.data?.error || "API 테스트 중 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          error: "API 테스트 중 오류가 발생했습니다.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 기타 기능 (JSON 포맷팅, 스타일링 등)은 기존 코드를 유지하며 생략...

  // 렌더링 부분 생략 (기존 JSX 코드 유지)

  // 나머지 코드...

  // JSON 형식 검사 및 포맷팅
  const formatJson = (jsonStr: string, setter: (formatted: string) => void) => {
    try {
      const parsed = JSON.parse(jsonStr)
      setter(JSON.stringify(parsed, null, 2))
    } catch (err) {
      console.error("JSON 형식이 올바르지 않습니다.", err)
    }
  }

  // 메서드별 색상 스타일
  const getMethodStyles = (methodType: string) => {
    switch (methodType) {
      case "GET":
        return "bg-green-500 hover:bg-green-600"
      case "POST":
        return "bg-blue-500 hover:bg-blue-600"
      case "PUT":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "DELETE":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 영역 - 컴팩트하게 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">API 편집기</h2>
          <div className="flex space-x-1">
            <button onClick={handleSaveApi} disabled={isLoading} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm">
              {apiSpecVersionId ? "수정" : "생성"}
            </button>
            {apiSpecVersionId && (
              <button onClick={handleDeleteApi} disabled={isLoading} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm">
                삭제
              </button>
            )}
            <button onClick={handleTestApi} disabled={isLoading} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm">
              테스트
            </button>
            <button onClick={() => setShowSpecsList(!showSpecsList)} disabled={isLoading} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm">
              API 목록
            </button>
          </div>
        </div>

        {/* API 목록 패널 (클릭 시에만 표시) */}
        {showSpecsList && (
          <div className="absolute z-30 top-16 right-4 w-3/4 max-h-96 bg-white border shadow-lg rounded-lg p-3 overflow-auto">
            <h3 className="font-medium mb-2">API 스펙 목록</h3>
            {apiSpecsList.length === 0 ? (
              <p className="text-gray-500">API 스펙이 없습니다.</p>
            ) : (
              <ul className="divide-y">
                {apiSpecsList.map((spec) => (
                  <li key={spec.apiSpecVersionId} className="py-2 hover:bg-gray-50 cursor-pointer" onClick={() => selectApiSpec(spec)}>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded text-white text-xs mr-2 ${getMethodStyles(spec.httpMethod || "GET")}`}>{spec.httpMethod}</span>
                      <span className="font-medium">{spec.endpoint}</span>
                    </div>
                    <div className="text-sm text-gray-500 ml-12">{spec.summary || "설명 없음"}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-right">
              <button onClick={() => fetchApiSpecsByProject(scrudProjectId)} className="text-blue-500 hover:text-blue-700 text-sm">
                새로고침
              </button>
            </div>
          </div>
        )}

        {/* 기본 정보 입력 - 컴팩트하게 */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="col-span-1">
            <label className="block text-xs text-gray-700 mb-1">프로젝트 ID</label>
            <input type="number" className="w-full border rounded px-2 py-1 text-sm" value={scrudProjectId} onChange={(e) => setScrudProjectId(Number(e.target.value))} min="1" />
          </div>
          <div className="col-span-4">
            <label className="block text-xs text-gray-700 mb-1">API 요약</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" placeholder="API 요약 (간단한 제목)" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
        </div>

        <div className="mb-2">
          <div className="flex space-x-2">
            <select className={`px-3 py-1 rounded text-white text-sm ${getMethodStyles(method)}`} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input type="text" className="flex-1 border rounded px-2 py-1 text-sm" placeholder="API 엔드포인트 (예: /api/v1/users)" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-700 mb-1">API 설명</label>
          <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="API 상세 설명" rows={1} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {/* 탭 영역 */}
      <div className="flex border-b text-sm">
        <button className={`px-3 py-2 ${activeTab === "Body" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Body")}>
          Request Body
        </button>
        <button className={`px-3 py-2 ${activeTab === "Path" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Path")}>
          Path 파라미터
        </button>
        <button className={`px-3 py-2 ${activeTab === "Query" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Query")}>
          Query 파라미터
        </button>
        <button className={`px-3 py-2 ${activeTab === "Response" ? "border-b-2 border-blue-500 font-medium" : ""}`} onClick={() => setActiveTab("Response")}>
          Response
        </button>
      </div>

      {/* 탭 내용 - 충분한 높이 할당 */}
      <div className="flex-1 overflow-auto p-3" style={{ minHeight: "300px" }}>
        {/* Body 탭 */}
        {activeTab === "Body" && (
          <div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
              <div className="flex space-x-2">
                <button
                  className={`px-2 py-1 text-sm rounded border ${bodyMode === "none" ? "bg-blue-100 border-blue-500" : ""}`}
                  onClick={() => setBodyMode("none")}
                  disabled={method === "GET"} // GET 메서드는 body가 없음
                >
                  None
                </button>
                <button
                  className={`px-2 py-1 text-sm rounded border ${bodyMode === "raw" ? "bg-blue-100 border-blue-500" : ""}`}
                  onClick={() => setBodyMode("raw")}
                  disabled={method === "GET"} // GET 메서드는 body가 없음
                >
                  Raw
                </button>
                <button
                  className={`px-2 py-1 text-sm rounded border ${bodyMode === "form-data" ? "bg-blue-100 border-blue-500" : ""}`}
                  onClick={() => setBodyMode("form-data")}
                  disabled={method === "GET"} // GET 메서드는 body가 없음
                >
                  Form Data
                </button>
                <button
                  className={`px-2 py-1 text-sm rounded border ${bodyMode === "x-www-form-urlencoded" ? "bg-blue-100 border-blue-500" : ""}`}
                  onClick={() => setBodyMode("x-www-form-urlencoded")}
                  disabled={method === "GET"} // GET 메서드는 body가 없음
                >
                  x-www-form-urlencoded
                </button>
              </div>
            </div>

            {bodyMode === "raw" && (
              <div>
                <div className="flex justify-between mb-2">
                  <div>
                    <select className="border rounded px-2 py-1 text-sm" value={rawBodyFormat} onChange={(e) => setRawBodyFormat(e.target.value as "json" | "text" | "xml" | "javascript" | "html")}>
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                      <option value="xml">XML</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>

                  {rawBodyFormat === "json" && (
                    <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(rawBody, setRawBody)}>
                      Format JSON
                    </button>
                  )}
                </div>

                <textarea
                  className="w-full border rounded px-2 py-1 font-mono text-sm"
                  value={rawBody}
                  onChange={(e) => setRawBody(e.target.value)}
                  placeholder={rawBodyFormat === "json" ? "{ ... }" : rawBodyFormat === "xml" ? "<root>...</root>" : "Enter your request body here"}
                  disabled={method === "GET"} // GET 메서드는 body가 없음
                  style={{ minHeight: "200px" }} // 최소 높이 지정
                />
              </div>
            )}

            {(bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") && (
              <div>
                <div className="grid grid-cols-12 gap-2 mb-2 font-medium">
                  <div className="col-span-5">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>

                {bodyParams.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      className="col-span-5 border rounded px-3 py-2"
                      value={param.key}
                      onChange={(e) => {
                        const newParams = [...bodyParams]
                        newParams[index].key = e.target.value
                        setBodyParams(newParams)
                      }}
                      placeholder="Key"
                    />
                    <input
                      className="col-span-6 border rounded px-3 py-2"
                      value={param.value}
                      onChange={(e) => {
                        const newParams = [...bodyParams]
                        newParams[index].value = e.target.value
                        setBodyParams(newParams)
                      }}
                      placeholder="Value"
                    />
                    <button
                      className="col-span-1 text-red-500 hover:text-red-700"
                      onClick={() => {
                        const newParams = [...bodyParams]
                        newParams.splice(index, 1)
                        if (newParams.length === 0) {
                          setBodyParams([{ key: "", value: "" }])
                        } else {
                          setBodyParams(newParams)
                        }
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}

                <button className="px-3 py-1 border rounded hover:bg-gray-100" onClick={() => setBodyParams([...bodyParams, { key: "", value: "" }])}>
                  Add Param
                </button>
              </div>
            )}

            {(method === "GET" || bodyMode === "none") && <div className="text-gray-500 italic">GET 요청 또는 None 타입에서는 Body를 사용할 수 없습니다.</div>}
          </div>
        )}

        {/* Path 파라미터 탭 */}
        {activeTab === "Path" && (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Path 파라미터</label>
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(pathParamsJson, setPathParamsJson)}>
                Format JSON
              </button>
            </div>

            <div className="mb-2 text-sm text-gray-500">
              <p>API 엔드포인트의 경로 파라미터 값을 설정합니다. (예: /api/users/&#123;id&#125;에서 id 값)</p>
            </div>

            <textarea
              className="w-full border rounded px-2 py-1 font-mono text-sm"
              value={pathParamsJson}
              onChange={(e) => setPathParamsJson(e.target.value)}
              placeholder='{ "id": "123" }'
              style={{ minHeight: "200px" }} // 최소 높이 지정
            />

            {!endpoint.includes("{") && (
              <div className="mt-2 text-yellow-600 text-sm">현재 API 엔드포인트에 경로 파라미터가 없습니다. 파라미터를 추가하려면 엔드포인트에 {"{parameter}"} 형식을 사용하세요.</div>
            )}
          </div>
        )}

        {/* Query 파라미터 탭 */}
        {activeTab === "Query" && (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Query 파라미터</label>
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(queryParamsJson, setQueryParamsJson)}>
                Format JSON
              </button>
            </div>

            <div className="mb-2 text-sm text-gray-500">
              <p>API 엔드포인트의 쿼리 파라미터 값을 설정합니다. (예: ?page=1&size=10)</p>
            </div>

            <textarea
              className="w-full border rounded px-2 py-1 font-mono text-sm"
              value={queryParamsJson}
              onChange={(e) => setQueryParamsJson(e.target.value)}
              placeholder='{ "page": "1", "size": "10" }'
              style={{ minHeight: "200px" }} // 최소 높이 지정
            />
          </div>
        )}

        {/* Response 탭 */}
        {activeTab === "Response" && (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">응답 예시</label>
              <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(responseJson, setResponseJson)}>
                Format JSON
              </button>
            </div>

            <div className="mb-2 text-sm text-gray-500">
              <p>API 응답 예시를 JSON 형식으로 작성합니다.</p>
            </div>

            <textarea
              className="w-full border rounded px-2 py-1 font-mono text-sm"
              value={responseJson}
              onChange={(e) => setResponseJson(e.target.value)}
              placeholder='{ "data": {}, "message": "성공" }'
              style={{ minHeight: "200px" }} // 최소 높이 지정
            />
          </div>
        )}
      </div>

      {/* 응답 결과 영역 */}
      {apiResponse && (
        <div className="p-3 border-t">
          <h3 className="font-medium mb-2 text-sm">응답 결과</h3>
          <div className={`p-2 rounded ${apiResponse.error ? "bg-red-50 border border-red-300" : "bg-green-50 border border-green-300"}`}>
            <div className="text-sm mb-1">상태 코드: {apiResponse.status}</div>
            {apiResponse.error ? (
              <div className="text-red-600 text-sm">{apiResponse.error}</div>
            ) : (
              <pre className="whitespace-pre-wrap text-xs overflow-auto p-2 bg-white border rounded" style={{ maxHeight: "200px", minHeight: "100px" }}>
                {apiResponse.data ? JSON.stringify(apiResponse.data, null, 2) : "응답이 없습니다."}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">처리 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  )
}
