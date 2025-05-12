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
  // 메서드별 색상 스타일
  const getMethodStyles = (methodType: string) => {
    switch (methodType) {
      case "GET":
        return "bg-green-500 hover:bg-green-600"
      case "POST":
        return "bg-blue-500 hover:bg-blue-600"
      case "PUT":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "PATCH":
        return "bg-purple-500 hover:bg-purple-600"
      case "DELETE":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="p-3 bg-white">
      {/* API 요약 입력 */}
      <div className="grid grid-cols-1 gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-700 mb-1">API 요약</label>
          <input type="text" className="w-full border rounded px-2 py-1 text-sm" placeholder="API 요약 (간단한 제목)" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
      </div>

      {/* HTTP 메서드 및 엔드포인트 입력 */}
      <div className="mb-2">
        <div className="flex space-x-2">
          <select className={`px-3 py-1 rounded text-white text-sm ${getMethodStyles(method)}`} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET" className="bg-white text-black">
              GET
            </option>
            <option value="POST" className="bg-white text-black">
              POST
            </option>
            <option value="PUT" className="bg-white text-black">
              PUT
            </option>
            <option value="PATCH" className="bg-white text-black">
              PATCH
            </option>
            <option value="DELETE" className="bg-white text-black">
              DELETE
            </option>
          </select>
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
