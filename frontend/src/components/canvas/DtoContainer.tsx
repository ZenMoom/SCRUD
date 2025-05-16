"use client"

import { useState } from "react"
import type { DiagramResponse, DtoModelDto } from "@generated/model"
import { Loader2, X, ChevronDown, ChevronUp, Code } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface DtoContainerProps {
  diagramData: DiagramResponse | null
  loading: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

// DTO 타입 가드
function isDtoModelDto(dto: unknown): dto is DtoModelDto {
  if (!dto || typeof dto !== "object") return false
  const d = dto as Record<string, unknown>
  return typeof d.dtoId === "string" && typeof d.name === "string"
}

export default function DtoContainer({ diagramData, loading, isCollapsed, onToggleCollapse }: DtoContainerProps) {
  const [selectedDto, setSelectedDto] = useState<string | null>(null)

  // DTO 선택 핸들러 - undefined 처리 추가
  const handleSelectDto = (dtoId: string | undefined) => {
    // dtoId가 undefined인 경우 null로 설정
    setSelectedDto(dtoId || null)
  }

  // 유효한 DTO만 필터링
  const validDtos = !loading && diagramData && diagramData.dto && Array.isArray(diagramData.dto) ? diagramData.dto.filter(isDtoModelDto) : []

  // 선택된 DTO 찾기
  const selectedDtoData = selectedDto ? validDtos.find((dto) => dto.dtoId === selectedDto) : null

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md border-t border-gray-200">
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
      <div className="h-full flex items-center justify-center bg-white rounded-lg shadow-md border-t border-gray-200">
        <div className="p-6 max-w-md text-center">
          <p className="text-gray-600">DTO 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white border-t border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer" onClick={onToggleCollapse}>
        <div className="flex items-center gap-2">
          <Code size={16} className="text-gray-600" />
          <h3 className="font-medium text-gray-700">DTO 정보</h3>
        </div>
        <button className="text-gray-500 hover:text-gray-700">{isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
      </div>

      {/* 본문 - 접혀있지 않을 때만 표시 */}
      {!isCollapsed && (
        <div className="flex h-[calc(100%-40px)]">
          {/* DTO 목록 */}
          <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
            <ul>
              {validDtos.map((dto, index) => (
                <li
                  key={`dto-${dto.dtoId || index}`}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${selectedDto === dto.dtoId ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                  onClick={() => handleSelectDto(dto.dtoId)}
                >
                  <div className="font-medium">{dto.name}</div>
                  {dto.description && <div className="text-xs text-gray-500 truncate">{dto.description}</div>}
                </li>
              ))}
            </ul>
          </div>

          {/* DTO 상세 정보 */}
          <div className="w-3/4 overflow-auto p-2">
            {selectedDtoData ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">{selectedDtoData.name}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDto(null)
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedDtoData.description && <p className="text-sm text-gray-600 mb-2">{selectedDtoData.description}</p>}
                {selectedDtoData.body && (
                  <SyntaxHighlighter
                    language="java"
                    style={vscDarkPlus}
                    customStyle={{
                      fontSize: "12px",
                      borderRadius: "4px",
                      maxHeight: "140px",
                    }}
                  >
                    {selectedDtoData.body}
                  </SyntaxHighlighter>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">DTO를 선택하면 상세 정보가 표시됩니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
