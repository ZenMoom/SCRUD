"use client"

import type React from "react"
import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { ChevronDown, ChevronUp, Info, Copy, Check } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { useState } from "react"

interface MethodNodeData {
  signature: string
  body: string
  description: string
  isExpanded?: boolean
  isInterface?: boolean
  isTargeted?: boolean // 타겟 노드 여부 추가
  name?: string // 메서드 이름 추가
}

export const MethodNode = memo(({ id, data, selected }: NodeProps<MethodNodeData>) => {
  const { signature, body, description, isExpanded = false, isInterface = false, isTargeted = false } = data
  const [copied, setCopied] = useState(false)

  const toggleExpand = (e: React.MouseEvent) => {
    // 이벤트 버블링 방지
    e.stopPropagation()
    e.preventDefault()

    console.log("토글 버튼 클릭:", id, "현재 상태:", isExpanded)

    // 커스텀 이벤트 생성 및 발송
    const event = new CustomEvent("toggleMethodExpand", {
      detail: { nodeId: id },
    })
    document.dispatchEvent(event)
  }

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    navigator.clipboard.writeText(body).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={`p-2 rounded-md border ${isTargeted ? "border-red-500 border-dashed animate-pulse shadow-red-100" : selected ? "border-blue-500 shadow-md" : "border-gray-300"} bg-white w-[350px]`}
      style={{
        transition: "height 0.3s ease-in-out, opacity 0.2s ease-in-out, border 0.2s ease-in-out",
        opacity: isTargeted ? 1 : 0.85, // 타겟 노드는 더 밝게
      }}
    >
      {/* 시그니처 부분 */}
      <div className={`font-mono text-sm p-2 ${isTargeted ? "bg-red-50" : "bg-gray-100"} rounded-t-md flex items-start justify-between`}>
        <div className="flex-1 break-words">{signature}</div>
        <div className="ml-2 text-gray-500 hover:text-gray-700 group relative">
          <Info className="w-4 h-4" />
          <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-white shadow-lg rounded-md border border-gray-200 text-xs text-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
            {description}
          </div>
        </div>
      </div>

      {/* 바디 부분 */}
      <div className="mt-1 relative">
        {!isInterface && (
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">Body</div>
            <div className="flex items-center">
              {isExpanded && (
                <button className="text-gray-500 hover:text-gray-700 p-1" onClick={copyToClipboard} type="button" title="코드 복사">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              <button className="text-gray-500 hover:text-gray-700 p-1" onClick={toggleExpand} type="button" title={isExpanded ? "접기" : "펼치기"}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {!isInterface && (
          <div
            className={`rounded-b-md border ${isTargeted ? "border-red-200" : "border-gray-200"} overflow-hidden ${isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0 border-0"}`}
            style={{
              transition: "max-height 0.3s ease-in-out, opacity 0.2s ease-in-out, border 0.1s ease-in-out",
            }}
          >
            {isExpanded && (
              <SyntaxHighlighter
                language="typescript"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "8px",
                  fontSize: "11px",
                  borderRadius: "0 0 6px 6px",
                  maxHeight: "240px",
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {body || "// 메서드 바디가 없습니다."}
              </SyntaxHighlighter>
            )}
          </div>
        )}

        {isInterface && <div className="text-xs text-gray-500 italic p-2">인터페이스 메서드는 바디가 없습니다.</div>}
      </div>

      {/* 핸들 */}
      <Handle type="source" position={Position.Right} id="right" style={{ background: "#555" }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: "#555" }} />
    </div>
  )
})

MethodNode.displayName = "MethodNode"
