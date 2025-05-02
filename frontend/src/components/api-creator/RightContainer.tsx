// components/api-creator/RightContainer.tsx
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
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
    { key: "키 입력", value: "값 입력" },
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

  // API 생성 핸들러 (UI 데모용)
  const handleCreateApi = () => {
    alert(`API가 성공적으로 생성되었습니다: ${method} ${endpoint}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full w-full flex flex-col">
      <div className="mb-4 border-b pb-4 w-full">
        <div className="flex items-center mb-2 w-full">
          <div className="relative">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="appearance-none bg-green-100 border-2 border-green-200 rounded py-1 px-3 pr-8 text-green-700 font-medium">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="ml-2 flex-1 border-b border-gray-300 focus:outline-none focus:border-blue-500"
            placeholder="api/endpoint"
          />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-sm text-gray-600 border rounded p-2 mt-2" placeholder="API 설명을 입력하세요" rows={2} />
      </div>

      <div className="flex-1 w-full overflow-hidden">
        <ul className="flex border-b w-full overflow-x-auto">
          <li className="mr-4">
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Params" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Params")
              }}
            >
              Params
            </a>
          </li>
          <li className="mr-4">
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Authorization" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Authorization")
              }}
            >
              Authorization
            </a>
          </li>
          <li className="mr-4">
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Headers" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Headers")
              }}
            >
              Headers
            </a>
          </li>
          <li className="mr-4">
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Body" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Body")
              }}
            >
              Body
            </a>
          </li>
          <li className="mr-4">
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Scripts" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Scripts")
              }}
            >
              Scripts
            </a>
          </li>
          <li>
            <a
              className={`inline-block py-2 px-1 font-medium whitespace-nowrap ${activeTab === "Settings" ? "border-b-2 border-black" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setActiveTab("Settings")
              }}
            >
              Settings
            </a>
          </li>
        </ul>

        <div className="mt-4 w-full overflow-x-auto">
          {activeTab === "Body" && (
            <div className="w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4 font-medium text-gray-700 border-b w-1/2">Key</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700 border-b w-1/2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyParams.map((param, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 w-1/2">
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) => handleParamChange(index, "key", e.target.value)}
                          className="w-full border-none focus:outline-none focus:ring-1 focus:ring-blue-500 p-1"
                          placeholder="키 입력"
                        />
                      </td>
                      <td className="py-2 px-4 w-1/2">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleParamChange(index, "value", e.target.value)}
                          className="w-full border-none focus:outline-none focus:ring-1 focus:ring-blue-500 p-1"
                          placeholder="값 입력"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 다른 탭의 내용은 필요에 따라 구현 가능 */}
        </div>
      </div>

      <div className="mt-6 w-full">
        <button className="w-full bg-black text-white rounded-md py-3 font-bold text-xl" onClick={handleCreateApi}>
          API 생성하기
        </button>
      </div>
    </div>
  )
}
