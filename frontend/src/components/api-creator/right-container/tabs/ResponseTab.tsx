import React from "react"

interface ResponseTabProps {
  responseJson: string
  setResponseJson: (json: string) => void
  formatJson: (json: string, setter: (formatted: string) => void) => void
}

const ResponseTab: React.FC<ResponseTabProps> = ({ responseJson, setResponseJson, formatJson }) => {
  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">응답 예시</label>
        {responseJson.trim() && (
          <button className="px-2 py-1 text-sm border rounded hover:bg-gray-100" onClick={() => formatJson(responseJson, setResponseJson)}>
            Format JSON
          </button>
        )}
      </div>

      <div className="mb-2 text-sm text-gray-500">
        <p>API 응답 예시를 JSON 형식으로 작성합니다.</p>
      </div>

      <textarea className="w-full border rounded px-2 py-1 font-mono text-sm" value={responseJson} onChange={(e) => setResponseJson(e.target.value)} style={{ height: "180px" }} />
    </div>
  )
}

export default ResponseTab
