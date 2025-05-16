import { memo } from "react"
import type { NodeProps } from "reactflow"
import { Code, Check } from "lucide-react"

interface ClassNodeData {
  label: string
  backgroundColor?: string
  isTargeted?: boolean
  name?: string
}

export const ClassNode = memo(({ data, selected }: NodeProps<ClassNodeData>) => {
  const { label, backgroundColor, isTargeted = false } = data

  // 테두리 스타일 결정 (우선순위: 타겟 > 선택 > 기본)
  const borderStyle = isTargeted ? "rounded-md border-red-500 border-dashed animate-pulse shadow-red-100" : selected ? "border-blue-500 shadow-blue-100" : "border-gray-200"

  return (
    <div
      className={`rounded-lg shadow-lg overflow-visible transition-all duration-200 border ${borderStyle}`}
      style={{
        backgroundColor: backgroundColor || "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(4px)",
        opacity: isTargeted ? 1 : selected ? 0.95 : 0.9, // 선택된 노드도 약간 더 불투명하게
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 헤더 섹션 */}
      <div
        className={`bg-gradient-to-r rounded-md ${
          isTargeted
            ? "from-red-600 to-red-800"
            : selected
            ? "from-blue-600 to-blue-800" // 선택된 노드는 파란색 헤더
            : "from-gray-700 to-gray-900"
        } text-white p-3 flex items-center gap-2`}
      >
        <div className="bg-white/20 p-1.5 rounded-md">{isTargeted ? <Check size={18} className="text-white" /> : <Code size={18} className="text-white" />}</div>
        <div className="font-bold text-base tracking-wide">{label}</div>
      </div>

      {/* 메서드 컨테이너 영역 - 자식 노드가 렌더링될 공간 */}
      <div className="flex-1 p-2 relative">{/* 자식 노드(메서드)는 ReactFlow에 의해 여기에 자동으로 렌더링됩니다 */}</div>

      {/* 하단 장식 */}
      <div
        className={`h-1 bg-gradient-to-r rounded-md ${
          isTargeted
            ? "from-red-400 via-red-500 to-red-600"
            : selected
            ? "from-blue-400 via-blue-500 to-blue-600" // 선택된 노드는 파란색 장식
            : "from-blue-400 via-purple-500 to-pink-500"
        }`}
      ></div>
    </div>
  )
})

ClassNode.displayName = "ClassNode"
