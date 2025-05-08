// components/canvas/nodes/MethodNode.tsx
"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { ChevronDown, ChevronUp, Info } from "lucide-react"

interface MethodNodeData {
  signature: string
  body: string
  description: string
  isExpanded?: boolean
  isInterface?: boolean
}

export const MethodNode = memo(({ id, data, selected }: NodeProps<MethodNodeData>) => {
  const { signature, body, description, isExpanded = false, isInterface = false } = data

  const toggleExpand = () => {
    const event = new CustomEvent("toggleMethodExpand", { detail: { nodeId: id } })
    document.dispatchEvent(event)
  }

  return (
    <div className={`p-2 rounded-md border ${selected ? "border-blue-500 shadow-md" : "border-gray-300"} bg-white w-[300px]`}>
      {/* 시그니처 부분 */}
      <div className="font-mono text-sm p-2 bg-gray-100 rounded-t-md flex items-start justify-between">
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
            <button className="text-gray-500 hover:text-gray-700 p-1" onClick={toggleExpand}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}

        {!isInterface && isExpanded && <div className="font-mono text-xs p-2 bg-gray-50 rounded-b-md border border-gray-200 whitespace-pre-wrap overflow-auto max-h-60">{body}</div>}

        {isInterface && <div className="text-xs text-gray-500 italic p-2">인터페이스 메서드는 바디가 없습니다.</div>}
      </div>

      {/* 핸들 */}
      <Handle type="source" position={Position.Right} id="right" style={{ background: "#555" }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: "#555" }} />
    </div>
  )
})

MethodNode.displayName = "MethodNode"
