import React from "react"

interface PathParamsTabProps {
  pathParamsJson: string
  setPathParamsJson: (json: string) => void
  formatJson: (json: string, setter: (formatted: string) => void) => void
  endpoint: string
}

const PathParamsTab: React.FC<PathParamsTabProps> = ({ pathParamsJson, setPathParamsJson, formatJson, endpoint }) => {
  return (
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
        style={{ height: "180px" }}
      />

      {!endpoint.includes("{") && (
        <div className="mt-2 text-yellow-600 text-sm">현재 API 엔드포인트에 경로 파라미터가 없습니다. 파라미터를 추가하려면 엔드포인트에 {"{parameter}"} 형식을 사용하세요.</div>
      )}
    </div>
  )
}

export default PathParamsTab
