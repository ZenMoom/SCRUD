// components/canvas/DiagramContainer.tsx
"use client"

import { DiagramResponse } from "@generated/model"

type DiagramContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
  error: string | null
}

export default function DiagramContainer({ diagramData, loading, error }: DiagramContainerProps) {
  return (
    <div className="h-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">다이어그램</h2>

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center h-[calc(100%-4rem)]">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border-l-4 border-red-500">
          <h3 className="font-semibold mb-2">오류 발생</h3>
          <p>{error}</p>
        </div>
      )}

      {/* 데이터 표시 */}
      {diagramData && !loading && (
        <div className="h-[calc(100%-4rem)] overflow-auto">
          {/* 실제 다이어그램 시각화가 들어갈 위치 */}
          <div className="p-4 bg-gray-50 rounded text-center h-full flex items-center justify-center">
            <div>
              <p className="text-gray-500 mb-3">다이어그램 시각화 영역</p>
              <pre className="bg-white p-3 rounded text-left text-xs overflow-auto max-h-[300px] border border-gray-200">{JSON.stringify(diagramData, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
