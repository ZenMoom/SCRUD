import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Code } from "lucide-react"

interface ClassNodeData {
  label: string
  description: string
  backgroundColor?: string
}

export const ClassNode = memo(({ data }: NodeProps<ClassNodeData>) => {
  const { label, description, backgroundColor } = data

  return (
    <div
      className="rounded-lg shadow-lg overflow-hidden transition-all duration-200 border border-gray-200"
      style={{
        backgroundColor: backgroundColor || "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-3 flex items-center gap-2">
        <div className="bg-white/20 p-1.5 rounded-md">
          <Code size={18} className="text-white" />
        </div>
        <div className="font-bold text-base tracking-wide">{label}</div>
      </div>

      {/* 설명 섹션 */}
      {description && (
        <div className="px-4 py-3 text-xs text-gray-600 border-b border-gray-200 bg-gray-50">
          <p className="line-clamp-2">{description}</p>
        </div>
      )}
    </div>
  )
})

ClassNode.displayName = "ClassNode"
