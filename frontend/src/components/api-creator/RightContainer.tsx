"use client"

import { useState, useEffect } from "react"

interface BodyParam {
  key: string
  value: string
}

interface RightContainerProps {
  selectedApi: string | null
}

export default function RightContainer({ selectedApi }: RightContainerProps) {
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

  useEffect(() => {
    if (selectedApi) {
      setEndpoint(selectedApi)
      // 기본값 설정 (실제로는 API 엔드포인트에 따라 달라질 수 있음)
      if (selectedApi.includes("/user/me")) {
        setMethod("GET")
        setDescription("현재 인증된 사용자의 개인 정보를 조회하는 API 요청으로, 로그인한 사용자의 프로필 데이터를 반환합니다.")
      } else if (selectedApi.includes("/post")) {
        setMethod("POST")
        setDescription("게시물 관련 API")
      } else if (selectedApi.includes("/OOO/XXX")) {
        setMethod("GET")
        setDescription("API 설명을 입력하세요")
      }
    }
  }, [selectedApi])

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

  // API 생성 핸들러 (UI 데모용)
  const handleCreateApi = () => {
    if (!endpoint.trim()) {
      alert("API 엔드포인트를 입력해주세요.")
      return
    }

    alert(`API가 성공적으로 생성되었습니다: ${method} ${endpoint}`)
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
      <div className="flex justify-between px-4 py-4 border-b border-gray-200">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">메서드</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`appearance-none border-0 rounded-md mt-1 py-1.5 pl-3 pr-8 text-white text-sm font-medium focus:outline-none ${getMethodStyles(method)}`}
            style={{ color: "white" }}
          >
            <option className="bg-white text-gray-800">GET</option>
            <option className="bg-white text-gray-800">POST</option>
            <option className="bg-white text-gray-800">PUT</option>
            <option className="bg-white text-gray-800">DELETE</option>
          </select>
        </div>
        <div className="flex-1 px-4">
          <span className="text-sm text-gray-500">엔드포인트</span>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full rounded-md border border-gray-300 mt-1 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            placeholder="api/endpoint"
          />
        </div>
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

          {/* 다른 탭의 내용은 필요에 따라 구현 가능 */}
          {activeTab !== "Body" && (
            <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 text-sm">{activeTab} 탭 내용이 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-200">
        <button
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium text-base hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={handleCreateApi}
        >
          API 생성하기
        </button>
      </div>
    </div>
  )
}
