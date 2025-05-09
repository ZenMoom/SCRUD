import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Code } from "lucide-react"

interface ClassNodeData {
  label: string
  description: string
  backgroundColor?: string
  isTargeted?: boolean // 타겟 노드 여부 추가
  name?: string // 클래스 이름 추가
}

export const ClassNode = memo(({ data }: NodeProps<ClassNodeData>) => {
  const { label, description, backgroundColor, isTargeted = false } = data

  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden transition-all duration-200 border ${isTargeted ? "border-red-500 border-dashed animate-pulse shadow-red-100" : "border-gray-200"}`}
      style={{
        backgroundColor: backgroundColor || "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        opacity: isTargeted ? 1 : 0.85, // 타겟 노드는 더 밝게
      }}
    >
      {/* 헤더 섹션 */}
      <div className={`bg-gradient-to-r ${isTargeted ? "from-red-600 to-red-800" : "from-gray-700 to-gray-900"} text-white p-3 flex items-center gap-2`}>
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

      {/* 메서드 컨테이너 영역 */}
      <div className="p-2">{/* 메서드 노드들이 여기에 렌더링됩니다 */}</div>

      {/* 하단 장식 */}
      <div className={`h-1 bg-gradient-to-r ${isTargeted ? "from-red-400 via-red-500 to-red-600" : "from-blue-400 via-purple-500 to-pink-500"}`}></div>
    </div>
  )
})

ClassNode.displayName = "ClassNode"
