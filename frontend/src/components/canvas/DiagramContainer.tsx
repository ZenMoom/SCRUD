"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, { Background, Controls, type Edge, type Node, useNodesState, useEdgesState, MiniMap, Panel, NodeToolbar, Position } from "reactflow"
import { Map, MapPinOffIcon as MapOff, ChevronRight, Target, X } from "lucide-react"
import "reactflow/dist/style.css"
import type { DiagramResponse } from "@generated/model"
import { MethodNode } from "./nodes/MethodNode"
import { ClassNode } from "./nodes/ClassNode"
import { InterfaceNode } from "./nodes/InterfaceNode"
import { CustomEdge } from "./edges/CustomEdge"

// 미리 정의된 배경색 배열 추가 (파스텔톤으로 구성)
const backgroundColors = [
  "rgba(255, 228, 225, 0.4)", // 연한 분홍색
  "rgba(230, 230, 250, 0.4)", // 연한 라벤더색
  "rgba(240, 255, 240, 0.4)", // 연한 허니듀색
  "rgba(255, 250, 205, 0.4)", // 연한 레몬 쉬폰색
  "rgba(245, 255, 250, 0.4)", // 연한 민트 크림색
  "rgba(240, 248, 255, 0.4)", // 연한 앨리스 블루색
  "rgba(255, 240, 245, 0.4)", // 연한 라벤더 블러쉬색
  "rgba(255, 245, 238, 0.4)", // 연한 씨쉘색
]

// 노드 및 엣지 타입 정의
const nodeTypes = {
  method: MethodNode,
  class: ClassNode,
  interface: InterfaceNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

// 메서드 노드의 기본 높이와 확장 시 추가 높이
const METHOD_BASE_HEIGHT = 80 // 기본 높이
const METHOD_EXPANDED_EXTRA_HEIGHT = 200 // 확장 시 추가 높이
const METHOD_VERTICAL_SPACING = 50 // 메서드 간 수직 간격 (증가)
const CLASS_PADDING_TOP = 120 // 클래스 상단 패딩 (제목 영역) (증가)
const CLASS_PADDING_BOTTOM = 70 // 클래스 하단 패딩 (증가)
const CLASS_WIDTH = 500 // 클래스 노드 너비 (증가)

// 선택 타입 정의
type SelectionType = "none" | "api" | "class" | "interface" | "method"

// 타겟 노드 정의
export interface TargetNode {
  id: string
  type: SelectionType
  name: string
  parentId?: string // 부모 노드 ID 추가 (메소드의 경우 클래스/인터페이스 ID)
}

// 컴포넌트 타입 정의
interface DiagramComponent {
  componentId: string
  name: string
  description?: string
  type: "CLASS" | "INTERFACE"
  positionX?: number
  positionY?: number
  methods?: DiagramMethod[]
}

// 메서드 타입 정의
interface DiagramMethod {
  methodId: string
  signature: string
  body?: string
  description?: string
}

// 연결 타입 정의
interface DiagramConnection {
  connectionId: string
  sourceMethodId: string
  targetMethodId: string
  type: string
}

// 노드 관계 맵 타입 정의
interface NodeRelationMap {
  [nodeId: string]: {
    parentId?: string
    childIds: string[]
  }
}

type DiagramContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
  error: string | null
  onSelectionChange?: (targets: TargetNode[]) => void
}

// 명시적으로 JSX.Element 반환 타입 지정
export default function DiagramContainer({ diagramData, loading, error, onSelectionChange }: DiagramContainerProps): React.ReactElement {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [targetNodes, setTargetNodes] = useState<TargetNode[]>([])
  const [showToolbar, setShowToolbar] = useState<string | null>(null)

  // 노드 관계 맵 (부모-자식 관계)
  const [nodeRelationMap, setNodeRelationMap] = useState<NodeRelationMap>({})

  // MiniMap 표시 여부를 제어하는 상태 추가
  const [showMiniMap, setShowMiniMap] = useState(true)

  // 노드 초기 위치를 저장할 상태 추가
  const [initialNodePositions, setInitialNodePositions] = useState<Record<string, { x: number; y: number }>>({})

  // 현재 버전과 다음 버전 상태 추가
  const currentVersion = diagramData?.metadata?.version || "1.0.0"

  // 노드가 이미 타겟에 있는지 확인하는 함수
  const isNodeTargeted = useCallback(
    (nodeId: string) => {
      return targetNodes.some((target) => target.id === nodeId)
    },
    [targetNodes]
  )

  // 타겟 노드 제거 핸들러 (자식 노드 제거 시 부모도 제거)
  const removeTargetNode = useCallback(
    (nodeId: string) => {
      setTargetNodes((prev) => {
        const targetNode = prev.find((target) => target.id === nodeId)
        if (!targetNode) return prev

        const newTargets = prev.filter((target) => target.id !== nodeId)

        // 메소드 노드인 경우 부모 클래스/인터페이스도 제거
        if (targetNode.type === "method" && targetNode.parentId) {
          // 같은 부모를 가진 다른 메소드가 있는지 확인
          const hasSiblings = newTargets.some((target) => target.parentId === targetNode.parentId && target.id !== nodeId)

          // 다른 형제 메소드가 없으면 부모도 제거
          if (!hasSiblings) {
            return newTargets.filter((target) => target.id !== targetNode.parentId)
          }
        }

        // 클래스/인터페이스인 경우 자식 메소드도 모두 제거
        if (targetNode.type === "class" || targetNode.type === "interface") {
          const childIds = nodeRelationMap[nodeId]?.childIds || []
          return newTargets.filter((target) => !childIds.includes(target.id))
        }

        return newTargets
      })
    },
    [nodeRelationMap]
  )

  // 타겟 노드 추가 핸들러 (클래스/인터페이스 선택 시 자식 메소드도 추가)
  const addTargetNode = useCallback(
    (node: Node) => {
      setTargetNodes((prev) => {
        // 이미 타겟에 있는지 확인
        const exists = prev.some((target) => target.id === node.id)
        if (exists) return prev

        const newTargets: TargetNode[] = [...prev]

        // 노드 타입 결정
        let nodeType: SelectionType = "api"
        if (node.type === "class") nodeType = "class"
        else if (node.type === "interface") nodeType = "interface"
        else if (node.type === "method") nodeType = "method"

        // 새 타겟 노드 추가
        const newTarget: TargetNode = {
          id: node.id,
          type: nodeType,
          name: node.data.name || node.id,
          parentId: nodeRelationMap[node.id]?.parentId,
        }

        newTargets.push(newTarget)

        // 클래스/인터페이스인 경우 자식 메소드도 추가
        if (nodeType === "class" || nodeType === "interface") {
          const childIds = nodeRelationMap[node.id]?.childIds || []

          childIds.forEach((childId) => {
            // 이미 타겟에 있는지 확인
            const childExists = [...prev, newTarget].some((target) => target.id === childId)
            if (!childExists) {
              const childNode = nodes.find((n) => n.id === childId)
              if (childNode) {
                newTargets.push({
                  id: childId,
                  type: "method",
                  name: childNode.data.name || childId,
                  parentId: node.id,
                })
              }
            }
          })
        }

        return newTargets
      })

      // 툴바 숨기기
      setShowToolbar(null)
    },
    [nodes, nodeRelationMap]
  )

  // 메서드 노드의 위치와 클래스 노드의 크기를 계산하는 함수
  const calculateLayout = useCallback(
    (components: DiagramComponent[], expandedNodeIds: Set<string>, savedPositions: Record<string, { x: number; y: number }>) => {
      const newNodes: Node[] = []
      const methodIdToNodeId: Record<string, string> = {}
      const updatedPositions: Record<string, { x: number; y: number }> = { ...savedPositions }
      const newNodeRelationMap: NodeRelationMap = {}

      // 각 컴포넌트(클래스/인터페이스)에 대해 처리
      components.forEach((component, componentIndex) => {
        const componentNodeId = `component-${component.componentId}`

        // 노드 관계 맵 초기화
        newNodeRelationMap[componentNodeId] = {
          childIds: [],
        }

        // 저장된 위치가 있으면 사용, 없으면 기본값 사용
        const posX = savedPositions[componentNodeId]?.x ?? component.positionX ?? componentIndex * 600 + 100
        const posY = savedPositions[componentNodeId]?.y ?? component.positionY ?? 150

        // 위치 저장
        updatedPositions[componentNodeId] = { x: posX, y: posY }

        // 배경색 선택
        const backgroundColor = component.type === "CLASS" ? backgroundColors[componentIndex % backgroundColors.length] : "rgba(230, 230, 250, 0.2)"

        // 메서드 노드 생성 및 위치 계산
        let totalHeight = CLASS_PADDING_TOP // 시작 높이 (클래스 제목 영역)
        const methodNodes: Node[] = []

        if (component.methods) {
          component.methods.forEach((method) => {
            const methodNodeId = `method-${method.methodId}`
            methodIdToNodeId[method.methodId] = methodNodeId

            // 부모-자식 관계 설정
            newNodeRelationMap[componentNodeId].childIds.push(methodNodeId)
            newNodeRelationMap[methodNodeId] = {
              parentId: componentNodeId,
              childIds: [],
            }

            // 메서드가 확장되었는지 확인
            const isExpanded = expandedNodeIds.has(methodNodeId)

            // 메서드 노드 높이 계산
            const methodHeight = isExpanded ? METHOD_BASE_HEIGHT + METHOD_EXPANDED_EXTRA_HEIGHT : METHOD_BASE_HEIGHT

            // 저장된 메서드 위치가 있으면 상대적 Y 위치만 업데이트
            const methodY = totalHeight

            // 타겟 노드인지 확인
            const isTargeted = targetNodes.some((target) => target.id === methodNodeId)

            // 메서드 노드 생성
            methodNodes.push({
              id: methodNodeId,
              type: "method",
              position: { x: 40, y: methodY }, // X 위치 증가
              data: {
                signature: method.signature,
                body: method.body || "",
                description: method.description || "",
                isInterface: component.type === "INTERFACE",
                isExpanded,
                name: method.signature.split("(")[0].trim(), // 메서드 이름 추출
                isTargeted, // 타겟 노드 여부 전달
              },
              parentNode: componentNodeId,
              extent: "parent",
            })

            // 다음 메서드의 위치 계산 (현재 메서드 높이 + 간격)
            totalHeight += methodHeight + METHOD_VERTICAL_SPACING
          })
        }

        // 클래스 노드의 총 높이 계산 (마지막 간격 제거 + 하단 패딩)
        totalHeight = totalHeight > CLASS_PADDING_TOP ? totalHeight - METHOD_VERTICAL_SPACING + CLASS_PADDING_BOTTOM : CLASS_PADDING_TOP + CLASS_PADDING_BOTTOM

        // 타겟 노드인지 확인
        const isTargeted = targetNodes.some((target) => target.id === componentNodeId)

        // 클래스/인터페이스 노드 생성
        newNodes.push({
          id: componentNodeId,
          type: component.type.toLowerCase(),
          position: { x: posX, y: posY },
          data: {
            label: component.name,
            description: component.description,
            backgroundColor,
            name: component.name,
            isTargeted, // 타겟 노드 여부 전달
          },
          style: {
            width: CLASS_WIDTH, // 넓이 증가
            height: totalHeight,
            backgroundColor,
            padding: "10px",
          },
        })

        // 메서드 노드 추가
        newNodes.push(...methodNodes)
      })

      // 노드 관계 맵 업데이트
      setNodeRelationMap(newNodeRelationMap)

      return { newNodes, methodIdToNodeId, updatedPositions }
    },
    [targetNodes]
  )

  // 데이터로부터 노드와 엣지 생성
  useEffect(() => {
    if (!diagramData || !diagramData.components) {
      console.log("다이어그램 데이터가 없거나 components가 없습니다:", diagramData)
      return
    }

    console.log("다이어그램 데이터 처리 시작:", diagramData)

    // 노드 레이아웃 계산 (초기 위치 전달)
    const { newNodes, methodIdToNodeId, updatedPositions } = calculateLayout(diagramData.components as DiagramComponent[], expandedNodes, initialNodePositions)

    // 초기 위치가 비어있는 경우에만 업데이트 (첫 렌더링 시에만)
    if (Object.keys(initialNodePositions).length === 0) {
      setInitialNodePositions(updatedPositions)
    }

    // 엣지 생성
    const newEdges: Edge[] = []
    if (diagramData.connections) {
      diagramData.connections.forEach((connection: DiagramConnection) => {
        const sourceNodeId = methodIdToNodeId[connection.sourceMethodId]
        const targetNodeId = methodIdToNodeId[connection.targetMethodId]

        if (sourceNodeId && targetNodeId) {
          newEdges.push({
            id: `edge-${connection.connectionId}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: "custom",
            data: {
              isInterfaceRelated: connection.type === "DOTTED",
            },
          })
        }
      })
    }

    console.log("생성된 노드:", newNodes)
    console.log("생성된 엣지:", newEdges)

    setNodes(newNodes)
    setEdges(newEdges)
  }, [diagramData, expandedNodes, calculateLayout, setNodes, setEdges, initialNodePositions, targetNodes])

  // 메서드 확장/축소 토글 핸들러
  const toggleMethodExpand = useCallback((nodeId: string) => {
    console.log("토글 메서드 확장:", nodeId)

    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // 이벤트 리스너 등록
  useEffect(() => {
    const handleToggleExpand = (e: CustomEvent) => {
      console.log("이벤트 수신:", e.detail)
      toggleMethodExpand(e.detail.nodeId)
    }

    const handleRemoveTarget = (e: CustomEvent) => {
      console.log("타겟 제거 이벤트 수신:", e.detail)
      if (e.detail && e.detail.nodeId) {
        removeTargetNode(e.detail.nodeId)
      }
    }

    // 이벤트 리스너 등록
    document.addEventListener("toggleMethodExpand", handleToggleExpand as EventListener)

    // 타겟 제거 이벤트 리스너 추가
    const diagramContainer = document.getElementById("diagram-container")
    if (diagramContainer) {
      diagramContainer.addEventListener("removeTarget", handleRemoveTarget as EventListener)
    }

    // 클린업 함수
    return () => {
      document.removeEventListener("toggleMethodExpand", handleToggleExpand as EventListener)

      if (diagramContainer) {
        diagramContainer.removeEventListener("removeTarget", handleRemoveTarget as EventListener)
      }
    }
  }, [toggleMethodExpand, removeTargetNode])

  // 노드 위치 변경 핸들러 추가 (ReactFlow의 onNodeDragStop 이벤트에 연결)
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // 클래스/인터페이스 노드만 위치 저장 (메서드 노드는 부모에 상대적)
    if (node.type === "class" || node.type === "interface") {
      setInitialNodePositions((prev) => ({
        ...prev,
        [node.id]: node.position,
      }))
    }
  }, [])

  // MiniMap 토글 핸들러
  const toggleMiniMap = useCallback(() => {
    setShowMiniMap((prev) => !prev)
  }, [])

  // 버전 이동 핸들러
  const handleVersionMove = useCallback(() => {
    // 현재 버전을 숫자로 변환
    const versionParts = currentVersion.split(".")
    const nextVersion = `${versionParts[0]}.${Number(versionParts[1]) + 1}.0`

    // 여기서는 실제 버전 이동 로직을 구현해야 합니다.
    // 예를 들어, 부모 컴포넌트로 이벤트를 전달하거나 API 호출 등
    console.log(`버전 이동: ${currentVersion} -> ${nextVersion}`)

    // 알림 표시
    alert(`버전 이동: ${currentVersion} -> ${nextVersion}`)
  }, [currentVersion])

  // 노드 클릭 핸들러
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation()
    setShowToolbar(node.id)
  }, [])

  // 배경 클릭 핸들러
  const onPaneClick = useCallback(() => {
    setShowToolbar(null)
  }, [])

  // 타겟 노드 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(targetNodes)
    }
  }, [targetNodes, onSelectionChange])

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="h-full p-4 bg-white rounded-lg shadow flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="h-full p-4 bg-white rounded-lg shadow">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border-l-4 border-red-500">
          <h3 className="font-semibold mb-2">오류 발생</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // 데이터가 없는 경우
  if (!diagramData || !diagramData.components || diagramData.components.length === 0) {
    return (
      <div className="h-full p-4 bg-white rounded-lg shadow flex justify-center items-center">
        <p className="text-gray-500">다이어그램 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div id="diagram-container" style={{ width: "100%", height: "100%" }} className="bg-white rounded-lg shadow overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        deleteKeyCode={null}
        style={{ width: "100%", height: "100%" }}
        selectionOnDrag
      >
        <Background />
        <Controls />

        {/* 조건부로 MiniMap 렌더링 */}
        {showMiniMap && <MiniMap nodeStrokeWidth={3} zoomable pannable />}

        {/* 노드 툴바 */}
        {nodes.map((node) => (
          <NodeToolbar
            key={`toolbar-${node.id}`}
            nodeId={node.id}
            isVisible={showToolbar === node.id}
            position={Position.Top}
            offset={10}
            className="bg-white p-2 rounded-md shadow-md flex items-center gap-2"
          >
            {isNodeTargeted(node.id) ? (
              <button onClick={() => removeTargetNode(node.id)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                <X size={14} />
                <span>타겟 해제</span>
              </button>
            ) : (
              <button onClick={() => addTargetNode(node)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                <Target size={14} />
                <span>타겟 추가</span>
              </button>
            )}
          </NodeToolbar>
        ))}

        {/* 버전 정보 패널 (오른쪽 상단) */}
        <Panel position="top-right" className="mr-4 mt-4">
          <button onClick={handleVersionMove} className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-md hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium">버전: {currentVersion}</span>
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </Panel>

        {/* 선택 정보 표시 */}
        <Panel position="top-left" className="ml-4 mt-4">
          <div className="bg-white px-4 py-2 rounded-md shadow-md">
            <div className="text-sm font-medium">
              {targetNodes.length === 0 ? (
                "전체 API 선택됨"
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-500">선택된 타겟:</div>
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {targetNodes.map((target) => (
                      <div key={target.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        {target.type === "class" && "클래스: "}
                        {target.type === "interface" && "인터페이스: "}
                        {target.type === "method" && "메서드: "}
                        {target.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* MiniMap 토글 버튼 */}
        <Panel position="bottom-right" className="mb-2 mr-2">
          <button onClick={toggleMiniMap} className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors" title={showMiniMap ? "미니맵 숨기기" : "미니맵 표시"}>
            {showMiniMap ? <MapOff size={20} className="text-gray-600" /> : <Map size={20} className="text-gray-600" />}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
