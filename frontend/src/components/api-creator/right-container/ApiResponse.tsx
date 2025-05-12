import React from "react"
import { ApiResponseData } from "./types"

interface ApiResponseProps {
  apiResponse: ApiResponseData
}

const ApiResponse: React.FC<ApiResponseProps> = ({ apiResponse }) => {
  return (
    <div className="border-t p-4 bg-white">
      <h3 className="font-medium mb-2 text-sm">응답 결과</h3>
      <div className={`p-2 rounded ${apiResponse.error ? "bg-red-50 border border-red-300" : "bg-green-50 border border-green-300"}`}>
        <div className="text-sm mb-1">상태 코드: {apiResponse.status}</div>
        {apiResponse.error ? (
          <div className="text-red-600 text-sm">{apiResponse.error}</div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: "180px" }}>
            <pre className="whitespace-pre-wrap text-xs p-2 bg-white border rounded">{apiResponse.data ? JSON.stringify(apiResponse.data, null, 2) : "응답이 없습니다."}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApiResponse
