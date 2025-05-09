"use client"

import { useState } from "react"
import type { DiagramResponse } from "@generated/model"
import { Loader2, X } from "lucide-react"

interface DtoContainerProps {
  diagramData: DiagramResponse | null
  loading: boolean
}

export default function DtoContainer({ diagramData, loading }: DtoContainerProps) {
  const [selectedDto, setSelectedDto] = useState<string | null>(null)

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">DTO 로딩 중...</p>
        </div>
      </div>
    )
  }

  // 데이터가 없는 경우
  if (!diagramData || !diagramData.dto || diagramData.dto.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md">
        <div className="p-6 max-w-md text-center">
          <p className="text-gray-600">DTO 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  const selectedDtoData = selectedDto ? diagramData.dto.find((dto) => dto.dtoId === selectedDto) : null

  return (
    <div className="h-full bg-white rounded-lg shadow-md p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-4">DTO 목록</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {diagramData.dto.map((dto) => (
          <button
            key={dto.dtoId}
            className={`px-3 py-1 text-sm rounded-full ${selectedDto === dto.dtoId ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
            onClick={() => setSelectedDto(selectedDto === dto.dtoId ? null : dto.dtoId)}
          >
            {dto.name}
          </button>
        ))}
      </div>

      {selectedDtoData && (
        <div className="flex-1 overflow-auto border rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{selectedDtoData.name}</h3>
            <button onClick={() => setSelectedDto(null)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{selectedDtoData.description}</p>
          <pre className="text-xs font-mono bg-gray-50 p-3 rounded-md border border-gray-200 overflow-auto">{selectedDtoData.body}</pre>
        </div>
      )}

      {!selectedDtoData && <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">DTO를 선택하면 상세 정보가 표시됩니다.</div>}
    </div>
  )
}
