import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Layers, Check } from "lucide-react"

interface InterfaceNodeData {
  label: string
  description: string
  backgroundColor?: string
  isTargeted?: boolean
  name?: string
  showCheckIcon?: boolean
}

export const InterfaceNode = memo(({ data, selected }: NodeProps<InterfaceNodeData>) => {
  const { label, description, backgroundColor, isTargeted = false } = data

  // 테두리 스타일 결정 (우선순위: 타겟 > 선택 > 기본)
  const borderStyle = isTargeted ? "rounded-md border-green-500 border-dashed animate-pulse shadow-green-100" : selected ? "border-blue-500 shadow-blue-100" : "border-gray-200 border-dashed"

  return (
    <div
      className={`rounded-lg shadow-lg overflow-visible transition-all duration-200 border ${borderStyle}`}
      style={{
        backgroundColor: backgroundColor || "rgba(240, 248, 255, 0.85)",
        backdropFilter: "blur(4px)",
        opacity: isTargeted ? 1 : selected ? 0.95 : 0.9,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 헤더 섹션 - 인터페이스는 파란색/초록색 계열 사용 */}
      <div
        className={`bg-gradient-to-r rounded-md ${
          isTargeted ? "from-green-600 to-green-800" : selected ? "from-blue-600 to-blue-800" : "from-indigo-600 to-indigo-800"
        } text-white p-3 flex items-center gap-2`}
      >
        <div className="bg-white/20 p-1.5 rounded-md">{isTargeted ? <Check size={18} className="text-white" /> : <Layers size={18} className="text-white" />}</div>
        <div className="font-bold text-base tracking-wide italic">{label}</div>
      </div>

      {/* 설명 섹션 */}
      {description && (
        <div className="px-4 py-2 text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
          <p className="line-clamp-2 italic">{description}</p>
        </div>
      )}

      {/* 메서드 컨테이너 영역 - 자식 노드가 렌더링될 공간 */}
      <div className="flex-1 p-2 relative">{/* 자식 노드(메서드)는 ReactFlow에 의해 여기에 자동으로 렌더링됩니다 */}</div>

      {/* 하단 장식 */}
      <div
        className={`h-1 bg-gradient-to-r rounded-md ${
          isTargeted ? "from-green-400 via-green-500 to-green-600" : selected ? "from-blue-400 via-blue-500 to-blue-600" : "from-indigo-400 via-indigo-500 to-indigo-600"
        }`}
      ></div>
    </div>
  )
})

InterfaceNode.displayName = "InterfaceNode"
