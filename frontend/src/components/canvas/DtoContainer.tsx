// components/canvas/DtoContainer.tsx
"use client"

import { DiagramResponse } from "@generated/model"

type DtoContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
}

export default function DtoContainer({ diagramData, loading }: DtoContainerProps) {
  return (
    <div className="h-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">DTO 정보</h2>

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100%-4rem)]">
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : diagramData ? (
        <div className="h-[calc(100%-4rem)] overflow-auto">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="text-sm font-medium mb-2 text-gray-700">관련 모델</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>User</li>
                <li>Project</li>
                <li>Configuration</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <h3 className="text-sm font-medium mb-2 text-gray-700">API 속성</h3>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">메서드:</span> GET
                </p>
                <p>
                  <span className="font-medium">경로:</span> /api/diagrams
                </p>
                <p>
                  <span className="font-medium">상태:</span> 활성화
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[calc(100%-4rem)] text-gray-500">데이터가 없습니다</div>
      )}
    </div>
  )
}
