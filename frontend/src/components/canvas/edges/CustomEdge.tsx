// components/canvas/edges/CustomEdge.tsx
import { memo } from "react"
import { type EdgeProps, getBezierPath } from "reactflow"

interface CustomEdgeData {
  isInterfaceRelated: boolean
}

export const CustomEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<CustomEdgeData>) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const { isInterfaceRelated = false } = data || {}

  return (
    <path
      id={id}
      className={`react-flow__edge-path ${isInterfaceRelated ? "stroke-blue-500" : "stroke-gray-700"}`}
      d={edgePath}
      strokeWidth={1.5}
      strokeDasharray={isInterfaceRelated ? "5,5" : "none"}
    />
  )
})

CustomEdge.displayName = "CustomEdge"
