"use client"

import { useState, useCallback } from "react"
import type { DiagramResponse, DtoModelDto } from "@generated/model"
import { Loader2, Search, ChevronDown, ChevronRight, Code, Copy, Check } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface DtoContainerProps {
  diagramData: DiagramResponse | null
  loading: boolean
  onToggleCollapse: () => void
}

// DTO 타입 가드
function isDtoModelDto(dto: unknown): dto is DtoModelDto {
  if (!dto || typeof dto !== "object") return false
  const d = dto as Record<string, unknown>
  return typeof d.dtoId === "string" && typeof d.name === "string"
}

export default function DtoContainer({ diagramData, loading }: DtoContainerProps) {
  const [expandedDto, setExpandedDto] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 유효한 DTO만 필터링
  const validDtos = !loading && diagramData && diagramData.dto && Array.isArray(diagramData.dto) ? diagramData.dto.filter(isDtoModelDto) : []

  // 검색어로 필터링
  const filteredDtos = validDtos.filter((dto) => dto.name.toLowerCase().includes(searchTerm.toLowerCase()) || (dto.description && dto.description.toLowerCase().includes(searchTerm.toLowerCase())))

  // DTO 토글 핸들러
  const toggleDto = useCallback((dtoId: string) => {
    setExpandedDto((prev) => (prev === dtoId ? null : dtoId))
  }, [])

  // 코드 복사 핸들러
  const handleCopyCode = useCallback((dtoId: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(dtoId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">DTO 로딩 중...</p>
        </div>
      </div>
    )
  }

  // 데이터가 없는 경우
  if (!diagramData || !diagramData.dto || diagramData.dto.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600">DTO 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 검색 영역 */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="DTO 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* DTO 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredDtos.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">{searchTerm ? "검색 결과가 없습니다." : "DTO가 없습니다."}</div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredDtos.map((dto, index) => (
              <div key={dto.dtoId || `dto-${index}`} className="border rounded-md overflow-hidden">
                {/* DTO 헤더 */}
                <div
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${expandedDto === dto.dtoId ? "bg-blue-50" : ""}`}
                  onClick={() => dto.dtoId && toggleDto(dto.dtoId)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {expandedDto === dto.dtoId ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />}
                    <div className="truncate">
                      <div className="font-medium text-sm truncate">{dto.name}</div>
                    </div>
                  </div>
                  <Code className="h-4 w-4 text-gray-400" />
                </div>

                {/* DTO 상세 내용 */}
                {expandedDto === dto.dtoId && (
                  <div className="p-3 border-t bg-gray-50">
                    {dto.description && <div className="mb-2 text-xs text-gray-600">{dto.description}</div>}
                    {dto.body && (
                      <div className="relative">
                        <div className="absolute right-2 top-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (dto.dtoId) {
                                handleCopyCode(dto.dtoId, dto.body || "")
                              }
                            }}
                            className="p-1 bg-gray-800 bg-opacity-70 rounded text-white hover:bg-opacity-90 transition-all"
                            title="코드 복사"
                          >
                            {copiedId === dto.dtoId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language="java"
                          style={vscDarkPlus}
                          customStyle={{
                            fontSize: "11px",
                            borderRadius: "4px",
                            maxHeight: "200px",
                            margin: 0,
                          }}
                        >
                          {dto.body}
                        </SyntaxHighlighter>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
