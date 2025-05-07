"use client"

import { useState, useEffect } from "react"
import axios from "axios"

interface BodyParam {
  key: string
  value: string
}

// API 응답을 위한 인터페이스 추가
interface ApiResponseData {
  status: number
  data?: Record<string, unknown>
  error?: string
}

interface RightContainerProps {
  selectedApi: string | null
  selectedMethod: string | null
  onToggleVersionPanel: () => void
}

export default function RightContainer({ selectedApi, selectedMethod, onToggleVersionPanel }: RightContainerProps) {
  const [method, setMethod] = useState<string>("GET")
  const [endpoint, setEndpoint] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [bodyParams, setBodyParams] = useState<BodyParam[]>([
    { key: "", value: "" },
    { key: "", value: "" },
    { key: "", value: "" },
    { key: "", value: "" },
  ])
  const [activeTab, setActiveTab] = useState<string>("Body")
  const [apiResponse, setApiResponse] = useState<ApiResponseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Postman 스타일 Body 관련 상태 추가
  const [bodyMode, setBodyMode] = useState<"none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary">("raw")
  const [rawBodyFormat, setRawBodyFormat] = useState<"json" | "text" | "xml" | "javascript" | "html">("json")
  const [rawBody, setRawBody] = useState<string>('{\n  "key": "value"\n}')

  // 바디 타입별 콘텐츠 타입 매핑
  const contentTypeMap = {
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
        setDescription("현재 인증된 사용자의 개인 정보를 조회하는 API 요청으로, 로그인한 사용자의 프로필 데이터를 반환합니다.")
        // GET 메서드는 기본적으로 body가 없음
        if (selectedMethod === "GET") setBodyMode("none")
      } else if (selectedApi.includes("/user/login")) {
        setDescription("사용자 로그인 API")
        setRawBody('{\n  "username": "user@example.com",\n  "password": "password123"\n}')
      } else if (selectedApi.includes("/user/logout")) {
        setDescription("사용자 로그아웃 API")
      } else if (selectedApi.includes("/post/send")) {
        setDescription("게시물 전송 API")
        setRawBody('{\n  "title": "새 게시물",\n  "content": "게시물 내용입니다."\n}')
      } else if (selectedApi.includes("/post/delete")) {
        setDescription("게시물 삭제 API")
        setRawBody('{\n  "postId": 123\n}')
      } else if (selectedApi.includes("/post/update")) {
        setDescription("게시물 수정 API")
        setRawBody('{\n  "postId": 123,\n  "title": "수정된 제목",\n  "content": "수정된 내용"\n}')
      } else if (selectedApi.includes("/OOO/XXX")) {
        setDescription("API 설명을 입력하세요")
      }

      // GET 메서드인 경우 body mode를 none으로 설정
      if (selectedMethod === "GET") {
        setBodyMode("none")
      } else {
        setBodyMode("raw")
        setRawBodyFormat("json")
      }
    }
  }, [selectedApi, selectedMethod])

  // 바디 파라미터 업데이트 핸들러
  const handleParamChange = (index: number, field: "key" | "value", value: string) => {
    const newParams = [...bodyParams]
    newParams[index][field] = value
    setBodyParams(newParams)
  }

  // 바디 파라미터 추가 핸들러
  const addBodyParam = () => {
    setBodyParams([...bodyParams, { key: "", value: "" }])
  }

  // 바디 파라미터 삭제 핸들러
  const removeBodyParam = (index: number) => {
    const newParams = [...bodyParams]
    newParams.splice(index, 1)
    setBodyParams(newParams)
  }

  // JSON 형식 검사 및 포맷팅
  const formatJson = () => {
    try {
      const parsed = JSON.parse(rawBody)
      setRawBody(JSON.stringify(parsed, null, 2))
    } catch (error) {
      alert(error)
    }
  }

  // API 생성 또는 업데이트 핸들러
  const handleSaveApi = async () => {
    if (!endpoint.trim()) {
      alert("API 엔드포인트를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      let requestBodyData: Record<string, unknown> = {}

      // Body 모드에 따라 다른 처리
      if (bodyMode === "raw" && rawBodyFormat === "json") {
        try {
          requestBodyData = JSON.parse(rawBody)
        } catch (error) {
          alert(error)
          setIsLoading(false)
          return
        }
      } else if (bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") {
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            requestBodyData[param.key] = param.value
          }
        })
      }

      const apiSpecData = {
        endpoint,
        apiGroup: endpoint.split("/")[1] || "default",
        httpMethod: method,
        description,
        summary: endpoint.split("/").pop() || "API",
        requestBody: JSON.stringify(requestBodyData),
        pathParameters: JSON.stringify({}),
        queryParameters: JSON.stringify({}),
        response: JSON.stringify({ data: {}, message: "성공" }),
      }

      // 실제 구현에서는 axios 요청으로 대체
      // const response = await axios.post('/api/v1/api-specs', apiSpecData)

      // 더미 응답 (실제 구현 시 삭제)
      setTimeout(() => {
        setApiResponse({
          status: 200,
          data: {
            id: Math.floor(Math.random() * 1000),
            version: "1.0.0",
            ...apiSpecData,
          },
        })
        setIsLoading(false)
        alert(`API가 성공적으로 ${method === "PUT" ? "수정" : "생성"}되었습니다: ${method} ${endpoint}`)
      }, 800)
    } catch (error) {
      console.error("API 생성 오류:", error)

      // 오류 응답 처리
      if (axios.isAxiosError(error) && error.response) {
        setApiResponse({
          status: error.response.status,
          error: error.response.data?.message || "API 생성 중 오류가 발생했습니다.",
        })
      } else {
        setApiResponse({
          status: 500,
          error: "API 생성 중 오류가 발생했습니다.",
        })
      }
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
      let requestBodyData: Record<string, unknown> | string | FormData | null = null
      const headers: Record<string, string> = {}

      if (bodyMode === "raw") {
        if (rawBodyFormat === "json") {
          try {
            requestBodyData = JSON.parse(rawBody)
            headers["Content-Type"] = contentTypeMap[rawBodyFormat]
          } catch (error) {
            alert(error)
            setIsLoading(false)
            return
          }
        } else {
          // JSON이 아닌 다른 형식의 raw 데이터
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
        // FormData의 경우 Content-Type은 자동으로 설정됨
      } else if (bodyMode === "x-www-form-urlencoded") {
        const urlEncoded = new URLSearchParams()
        bodyParams.forEach((param) => {
          if (param.key.trim()) {
            urlEncoded.append(param.key, param.value)
          }
        })
        // URL 인코딩된 문자열로 변환하여 할당
        requestBodyData = urlEncoded.toString()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
      }

      // 백엔드 서버 주소
      const backendUrl = "http://localhost:8081" // 실제 백엔드 서버 주소로 변경 필요
      let response

      switch (method) {
        case "GET":
          response = await axios.get(`${backendUrl}${endpoint}`, { headers })
          break
        case "POST":
          response = await axios.post(`${backendUrl}${endpoint}`, requestBodyData, { headers })
          break
        case "PUT":
          response = await axios.put(`${backendUrl}${endpoint}`, requestBodyData, { headers })
          break
        case "DELETE":
          response = await axios.delete(`${backendUrl}${endpoint}`, {
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

      // 오류 응답 처리
      if (axios.isAxiosError(error) && error.response) {
        setApiResponse({
          status: error.response.status,
          error: error.response.data?.message || "API 테스트 중 오류가 발생했습니다.",
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
    <div className="bg-white h-full w-full flex flex-col">
      {/* 메서드 및 엔드포인트 영역 */}
      <div className="flex justify-between items-end px-4 py-4 border-b border-gray-200">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 mb-1">메서드</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`appearance-none border-0 rounded-md py-2 pl-3 pr-8 text-white text-sm font-medium focus:outline-none ${getMethodStyles(method)}`}
            style={{ color: "white" }}
          >
            <option className="bg-white text-gray-800">GET</option>
            <option className="bg-white text-gray-800">POST</option>
            <option className="bg-white text-gray-800">PUT</option>
            <option className="bg-white text-gray-800">DELETE</option>
          </select>
        </div>
        <div className="flex-1 px-4">
          <span className="text-sm text-gray-500 mb-1">엔드포인트</span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="api/endpoint"
          />
        </div>

        {/* 버전 패널 토글 버튼 */}
        <button className="ml-2 px-2 py-2 text-gray-500 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50" onClick={onToggleVersionPanel} title="버전 관리">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-200">
        <span className="text-sm text-gray-500">API 설명</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-sm text-gray-600 border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          placeholder="API 설명을 입력하세요"
          rows={2}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="px-2">
            {/* 탭 버튼 */}
            <div className="flex">
              {["Params", "Authorization", "Headers", "Body", "Scripts"].map((tab) => (
                <button
                  key={tab}
                  className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "Body" && (
            <div className="w-full">
              {/* Body 타입 선택 (Postman 스타일) */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <button className={`px-3 py-1 text-xs rounded ${bodyMode === "none" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`} onClick={() => setBodyMode("none")}>
                    None
                  </button>
                  <button className={`px-3 py-1 text-xs rounded ${bodyMode === "form-data" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`} onClick={() => setBodyMode("form-data")}>
                    form-data
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded ${bodyMode === "x-www-form-urlencoded" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                    onClick={() => setBodyMode("x-www-form-urlencoded")}
                  >
                    x-www-form-urlencoded
                  </button>
                  <button className={`px-3 py-1 text-xs rounded ${bodyMode === "raw" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`} onClick={() => setBodyMode("raw")}>
                    raw
                  </button>
                  <button className={`px-3 py-1 text-xs rounded ${bodyMode === "binary" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`} onClick={() => setBodyMode("binary")}>
                    binary
                  </button>
                </div>

                {/* Raw 선택 시 추가 옵션 */}
                {bodyMode === "raw" && (
                  <div className="flex justify-end mb-2">
                    <select
                      value={rawBodyFormat}
                      // 426줄: 명시적 타입 지정
                      onChange={(e) => setRawBodyFormat(e.target.value as "json" | "text" | "xml" | "javascript" | "html")}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                      <option value="xml">XML</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Body 모드에 따른 UI */}
              {bodyMode === "none" && (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm">이 요청에는 본문이 포함되지 않습니다.</p>
                </div>
              )}

              {(bodyMode === "form-data" || bodyMode === "x-www-form-urlencoded") && (
                <div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="text-left py-2 font-medium text-gray-700 border-b w-5/12">Key</th>
                        <th className="text-left py-2 font-medium text-gray-700 border-b w-6/12">Value</th>
                        <th className="py-2 border-b w-1/12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bodyParams.map((param, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 pr-2 w-5/12">
                            <input
                              type="text"
                              value={param.key}
                              onChange={(e) => handleParamChange(index, "key", e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="키 입력"
                            />
                          </td>
                          <td className="py-2 pr-2 w-6/12">
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => handleParamChange(index, "value", e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="값 입력"
                            />
                          </td>
                          <td className="py-2 text-center w-1/12">
                            <button onClick={() => removeBodyParam(index)} className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4">
                    <button onClick={addBodyParam} className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      파라미터 추가
                    </button>
                  </div>
                </div>
              )}

              {bodyMode === "raw" && (
                <div className="relative">
                  <textarea
                    value={rawBody}
                    onChange={(e) => setRawBody(e.target.value)}
                    className="w-full h-64 font-mono text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    spellCheck="false"
                  />
                  {rawBodyFormat === "json" && (
                    <button onClick={formatJson} className="absolute top-2 right-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 text-xs rounded" title="JSON 포맷팅">
                      Format
                    </button>
                  )}
                </div>
              )}

              {bodyMode === "binary" && (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">파일 선택</button>
                    <p className="text-gray-500 text-xs mt-2">아직 선택된 파일이 없습니다.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 다른 탭의 내용은 필요에 따라 구현 가능 */}
          {activeTab === "Params" && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-3">URL 파라미터를 설정합니다.</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-1/12">활성화</th>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-4/12">Key</th>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-5/12">Value</th>
                    <th className="py-2 border-b w-2/12">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <input type="checkbox" className="rounded text-blue-500 focus:ring-blue-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="파라미터 이름" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="파라미터 값" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="설명 (선택)" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <button className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                파라미터 추가
              </button>
            </div>
          )}

          {activeTab === "Headers" && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-3">HTTP 헤더를 설정합니다.</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-1/12">활성화</th>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-4/12">Key</th>
                    <th className="text-left py-2 font-medium text-gray-700 border-b w-5/12">Value</th>
                    <th className="py-2 border-b w-2/12">설명</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <input type="checkbox" className="rounded text-blue-500 focus:ring-blue-500" defaultChecked />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value="Content-Type" readOnly />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={bodyMode === "raw" ? contentTypeMap[rawBodyFormat] : "application/json"}
                        readOnly
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="설명 (선택)"
                        defaultValue="자동 설정됨"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <input type="checkbox" className="rounded text-blue-500 focus:ring-blue-500" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="헤더 이름" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="헤더 값" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="설명 (선택)" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <button className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                헤더 추가
              </button>
            </div>
          )}

          {activeTab === "Authorization" && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-3">API 인증 방식을 설정합니다.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">인증 유형</label>
                <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">토큰</label>
                  <input type="text" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Bearer 토큰 입력" />
                </div>
                <p className="text-xs text-gray-500">접두사 &quot;Bearer&quot;는 자동으로 추가됩니다. 토큰 값만 입력하세요.</p>
              </div>
            </div>
          )}

          {activeTab === "Scripts" && (
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-3">요청 전/후에 실행할 스크립트를 작성합니다.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pre-request Script</label>
                  <textarea
                    className="w-full h-32 font-mono text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="// 요청 전에 실행될 코드 작성
// 예: 환경 변수 설정, 데이터 준비 등
pm.variables.set('timestamp', new Date().getTime());"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tests</label>
                  <textarea
                    className="w-full h-32 font-mono text-sm border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="// 응답을 받은 후 실행될 코드 작성
// 예: 상태 코드 확인, 응답 데이터 검증 등
pm.test('응답 상태 코드가 200이어야 함', () => {
  pm.response.to.have.status(200);
});"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API 응답 결과 영역 */}
      {apiResponse && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
            <span>API 응답 결과</span>
            <div className="flex gap-2">
              <button className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors">복사</button>
              <button className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition-colors">다운로드</button>
            </div>
          </h3>
          <div className="max-h-48 overflow-y-auto rounded-md bg-white p-2 border border-gray-200">
            <div className="mb-2 flex items-center">
              <span className="font-medium text-xs mr-2">상태: </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${apiResponse.status >= 200 && apiResponse.status < 300 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {apiResponse.status}
              </span>
              <span className="text-xs text-gray-500 ml-2">{apiResponse.status >= 200 && apiResponse.status < 300 ? "성공" : "오류"}</span>
              <span className="text-xs text-gray-400 ml-auto">{new Date().toLocaleTimeString()}</span>
            </div>

            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex mb-2">
                <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-t border-t border-l border-r border-blue-200">Body</button>
                <button className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-t">Headers</button>
                <button className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-t">Cookies</button>
              </div>

              {apiResponse.error ? (
                <div className="text-red-600 text-xs p-2 bg-red-50 rounded border border-red-100">
                  <span className="font-medium">오류: </span>
                  {apiResponse.error}
                </div>
              ) : apiResponse.data ? (
                <pre className="overflow-x-auto text-xs font-mono bg-gray-50 p-2 rounded border border-gray-100">{JSON.stringify(apiResponse.data, null, 2)}</pre>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg py-3 font-medium text-sm hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSaveApi}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </span>
            ) : (
              `API ${method === "PUT" ? "수정" : "생성"}하기`
            )}
          </button>

          <button
            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-lg py-3 font-medium text-sm hover:from-blue-600 hover:to-teal-500 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleTestApi}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </span>
            ) : (
              "API 테스트"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
