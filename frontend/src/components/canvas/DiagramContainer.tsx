"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, { Background, Controls, type Edge, type Node, useNodesState, useEdgesState, MiniMap, Panel } from "reactflow"
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
const METHOD_VERTICAL_SPACING = 30 // 메서드 간 수직 간격
const CLASS_PADDING_TOP = 100 // 클래스 상단 패딩 (제목 영역)
const CLASS_PADDING_BOTTOM = 50 // 클래스 하단 패딩

type DiagramContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
  error: string | null
}

export default function DiagramContainer({ diagramData, loading, error }: DiagramContainerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 노드 초기 위치를 저장할 상태 추가
  const [initialNodePositions, setInitialNodePositions] = useState<Record<string, { x: number; y: number }>>({})

  // 메서드 노드의 위치와 클래스 노드의 크기를 계산하는 함수
  const calculateLayout = useCallback((components: any[], expandedNodeIds: Set<string>, savedPositions: Record<string, { x: number; y: number }>) => {
    const newNodes: Node[] = []
    const methodIdToNodeId: Record<string, string> = {}
    const updatedPositions: Record<string, { x: number; y: number }> = { ...savedPositions }

    // 각 컴포넌트(클래스/인터페이스)에 대해 처리
    components.forEach((component, componentIndex) => {
      const componentNodeId = `component-${component.componentId}`

      // 저장된 위치가 있으면 사용, 없으면 기본값 사용
      const posX = savedPositions[componentNodeId]?.x ?? component.positionX ?? componentIndex * 500 + 100
      const posY = savedPositions[componentNodeId]?.y ?? component.positionY ?? 150

      // 위치 저장
      updatedPositions[componentNodeId] = { x: posX, y: posY }

      // 배경색 선택
      const backgroundColor = component.type === "CLASS" ? backgroundColors[componentIndex % backgroundColors.length] : "rgba(230, 230, 250, 0.2)"

      // 메서드 노드 생성 및 위치 계산
      let totalHeight = CLASS_PADDING_TOP // 시작 높이 (클래스 제목 영역)
      const methodNodes: Node[] = []

      if (component.methods) {
        component.methods.forEach((method: any, methodIndex: number) => {
          const methodNodeId = `method-${method.methodId}`
          methodIdToNodeId[method.methodId] = methodNodeId

          // 메서드가 확장되었는지 확인
          const isExpanded = expandedNodeIds.has(methodNodeId)

          // 메서드 노드 높이 계산
          const methodHeight = isExpanded ? METHOD_BASE_HEIGHT + METHOD_EXPANDED_EXTRA_HEIGHT : METHOD_BASE_HEIGHT

          // 저장된 메서드 위치가 있으면 상대적 Y 위치만 업데이트
          const methodY = totalHeight

          // 메서드 노드 생성
          methodNodes.push({
            id: methodNodeId,
            type: "method",
            position: { x: 25, y: methodY },
            data: {
              signature: method.signature,
              body: method.body || "",
              description: method.description || "",
              isInterface: component.type === "INTERFACE",
              isExpanded,
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

      // 클래스/인터페이스 노드 생성
      newNodes.push({
        id: componentNodeId,
        type: component.type.toLowerCase(),
        position: { x: posX, y: posY },
        data: {
          label: component.name,
          description: component.description,
          backgroundColor,
        },
        style: {
          width: 400, // 넓이 증가
          height: totalHeight,
          backgroundColor,
          padding: "10px",
        },
      })

      // 메서드 노드 추가
      newNodes.push(...methodNodes)
    })

    return { newNodes, methodIdToNodeId, updatedPositions }
  }, [])

  // 데이터로부터 노드와 엣지 생성
  useEffect(() => {
    if (!diagramData || !diagramData.components) {
      console.log("다이어그램 데이터가 없거나 components가 없습니다:", diagramData)
      return
    }

    console.log("다이어그램 데이터 처리 시작:", diagramData)

    // 노드 레이아웃 계산 (초기 위치 전달)
    const { newNodes, methodIdToNodeId, updatedPositions } = calculateLayout(diagramData.components, expandedNodes, initialNodePositions)

    // 초기 위치가 비어있는 경우에만 업데이트 (첫 렌더링 시에만)
    if (Object.keys(initialNodePositions).length === 0) {
      setInitialNodePositions(updatedPositions)
    }

    // 엣지 생성
    const newEdges: Edge[] = []
    if (diagramData.connections) {
      diagramData.connections.forEach((connection) => {
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
  }, [diagramData, expandedNodes, calculateLayout, setNodes, setEdges, initialNodePositions])

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

    // 이벤트 리스너 등록
    document.addEventListener("toggleMethodExpand", handleToggleExpand as EventListener)

    // 클린업 함수
    return () => {
      document.removeEventListener("toggleMethodExpand", handleToggleExpand as EventListener)
    }
  }, [toggleMethodExpand])

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

  // 메타데이터가 없는 경우를 처리
  const metadata = diagramData.metadata || {
    name: "제목 없음",
    description: "설명 없음",
    version: "버전 정보 없음",
    lastModified: new Date().toISOString(),
  }

  return (
    <div style={{ width: "100%", height: "100%" }} className="bg-white rounded-lg shadow overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
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
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />

        <Panel position="top-left" className="bg-white p-4 rounded-md shadow-md max-w-md">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">{metadata.name}</h2>
            <p className="text-sm text-gray-600">{metadata.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
              <div>버전: {metadata.version}</div>
              <div>마지막 수정: {new Date(metadata.lastModified).toLocaleString()}</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
