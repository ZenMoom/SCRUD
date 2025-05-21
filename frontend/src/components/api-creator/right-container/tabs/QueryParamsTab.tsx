import React from "react"

interface QueryParamsTabProps {
  queryParamsJson: string
  setQueryParamsJson: (json: string) => void
  formatJson: (json: string, setter: (formatted: string) => void) => void
}

const QueryParamsTab: React.FC<QueryParamsTabProps> = ({ queryParamsJson, setQueryParamsJson, formatJson }) => {
  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Query 파라미터</label>
        {queryParamsJson.trim() && (
          <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(queryParamsJson, setQueryParamsJson)}>
            Format JSON
          </button>
        )}
      </div>

      <div className="mb-2 text-sm text-gray-500">
        <p>API 엔드포인트의 쿼리 파라미터 값을 설정합니다. (예: ?page=1&size=10)</p>
      </div>

      <textarea className="w-full border rounded px-2 py-1 font-mono text-sm" value={queryParamsJson} onChange={(e) => setQueryParamsJson(e.target.value)} style={{ height: "180px" }} />
    </div>
  )
}

export default QueryParamsTab
