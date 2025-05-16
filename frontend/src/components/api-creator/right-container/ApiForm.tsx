import React from "react"

interface ApiFormProps {
  summary: string
  setSummary: (summary: string) => void
  method: string
  setMethod: (method: string) => void
  endpoint: string
  setEndpoint: (endpoint: string) => void
  description: string
  setDescription: (description: string) => void
}

const ApiForm: React.FC<ApiFormProps> = ({ summary, setSummary, method, setMethod, endpoint, setEndpoint, description, setDescription }) => {
  // 메서드별 텍스트 색상 및 테두리 색상 - Postman 스타일
  const getMethodStyles = (methodType: string) => {
    switch (methodType) {
      case "GET":
        return {
          text: "text-green-800",
          border: "border-green-800",
          indicator: "bg-green-800",
        }
      case "POST":
        return {
          text: "text-blue-800",
          border: "border-blue-800",
          indicator: "bg-blue-800",
        }
      case "PUT":
        return {
          text: "text-yellow-800",
          border: "border-yellow-800",
          indicator: "bg-yellow-800",
        }
      case "PATCH":
        return {
          text: "text-purple-800", // PATCH 없을 경우 일관성 유지
          border: "border-purple-800",
          indicator: "bg-purple-800",
        }
      case "DELETE":
        return {
          text: "text-red-800",
          border: "border-red-800",
          indicator: "bg-red-800",
        }
      default:
        return {
          text: "text-gray-800",
          border: "border-gray-800",
          indicator: "bg-gray-800",
        }
    }
  }

  const methodStyle = getMethodStyles(method)

  return (
    <div className="p-3 bg-white">
      {/* API 요약 입력 */}
      <div className="grid grid-cols-1 gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-700 mb-1">API 요약</label>
          <input type="text" className="w-full border rounded px-2 py-1 text-sm" placeholder="API 요약 (간단한 제목)" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
      </div>

      {/* HTTP 메서드 및 엔드포인트 입력 - Postman 스타일 */}
      <div className="mb-2">
        <div className="flex space-x-2">
          <div className="relative">
            <select
              className={`appearance-none px-3 py-1 rounded text-sm font-medium border ${methodStyle.border} bg-white pr-8 focus:outline-none focus:ring-1 focus:ring-blue-400 ${methodStyle.text}`}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{ minWidth: "90px", textShadow: "0 0 1px rgba(0,0,0,0.1)" }}
            >
              <option value="GET" className={`bg-white font-medium ${getMethodStyles("GET").text} ${getMethodStyles("GET").border}`}>
                GET
              </option>
              <option value="POST" className={`bg-white font-medium ${getMethodStyles("POST").text} ${getMethodStyles("POST").border}`}>
                POST
              </option>
              <option value="PUT" className={`bg-white font-medium ${getMethodStyles("PUT").text} ${getMethodStyles("PUT").border}`}>
                PUT
              </option>
              <option value="PATCH" className={`bg-white font-medium ${getMethodStyles("PATCH").text} ${getMethodStyles("PATCH").border}`}>
                PATCH
              </option>
              <option value="DELETE" className={`bg-white font-medium ${getMethodStyles("DELETE").text} ${getMethodStyles("DELETE").border}`}>
                DELETE
              </option>
            </select>
            {/* 드롭다운 화살표 */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {/* 선택된 메서드 색상 표시 (왼쪽 테두리) */}
            <div className={`absolute left-0 top-0 h-full w-1 rounded-l ${methodStyle.indicator}`}></div>
          </div>
          <input type="text" className="flex-1 border rounded px-2 py-1 text-sm" placeholder="API 엔드포인트 (예: /api/v1/users)" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
        </div>
      </div>

      {/* API 설명 입력 */}
      <div className="mb-2">
        <label className="block text-xs text-gray-700 mb-1">API 설명</label>
        <textarea className="w-full border rounded px-2 py-1 text-sm" placeholder="API 상세 설명" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </div>
  )
}

export default ApiForm
