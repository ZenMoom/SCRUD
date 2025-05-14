import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Layers, Check } from "lucide-react"

interface InterfaceNodeData {
  label: string
  description: string
  backgroundColor?: string
  isTargeted?: boolean // 타겟 노드 여부 추가
  name?: string // 인터페이스 이름 추가
}

export const InterfaceNode = memo(({ data }: NodeProps<InterfaceNodeData>) => {
  const { label, description, backgroundColor, isTargeted = false } = data

  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden transition-all duration-200 border-dashed ${isTargeted ? "border-green-500 animate-pulse shadow-green-100" : "border-blue-300"}`}
      style={{
        backgroundColor: backgroundColor || "rgba(240, 248, 255, 0.8)",
        backdropFilter: "blur(8px)",
        opacity: isTargeted ? 1 : 0.85, // 타겟 노드는 더 밝게
      }}
    >
      {/* 헤더 섹션 - 인터페이스는 파란색 계열 사용 */}
      <div className={`bg-gradient-to-r ${isTargeted ? "from-green-600 to-green-800" : "from-blue-600 to-indigo-700"} text-white p-3 flex items-center gap-2`}>
        <div className="bg-white/20 p-1.5 rounded-md">{isTargeted ? <Check size={18} className="text-white" /> : <Layers size={18} className="text-white" />}</div>
        <div className="font-bold text-base tracking-wide italic">{label}</div>
      </div>

      {/* 설명 섹션 */}
      {description && (
        <div className={`px-4 py-3 text-xs ${isTargeted ? "text-green-700 bg-green-50 border-green-100" : "text-blue-700 bg-blue-50 border-blue-100"} border-b`}>
          <p className="line-clamp-2 italic">{description}</p>
        </div>
      )}
    </div>
  )
})

InterfaceNode.displayName = "InterfaceNode"
