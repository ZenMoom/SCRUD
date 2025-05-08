import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Layers } from "lucide-react"

interface InterfaceNodeData {
  label: string
  description: string
  backgroundColor?: string
}

export const InterfaceNode = memo(({ data }: NodeProps<InterfaceNodeData>) => {
  const { label, description, backgroundColor } = data

  return (
    <div
      className="rounded-lg shadow-lg overflow-hidden transition-all duration-200 border border-dashed border-blue-300"
      style={{
        backgroundColor: backgroundColor || "rgba(240, 248, 255, 0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* 헤더 섹션 - 인터페이스는 파란색 계열 사용 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded-md">
          <Layers size={18} className="text-white" />
        </div>
        <div className="font-bold text-base tracking-wide italic">{label}</div>
      </div>

      {/* 설명 섹션 */}
      {description && (
        <div className="px-4 py-3 text-xs text-blue-700 border-b border-blue-100 bg-blue-50">
          <p className="line-clamp-2 italic">{description}</p>
        </div>
      )}
    </div>
  )
})

InterfaceNode.displayName = "InterfaceNode"
