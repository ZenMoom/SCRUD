"use client"

import { useEffect } from "react"
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

type DiagramContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
  error: string | null
}

export default function DiagramContainer({ diagramData, loading, error }: DiagramContainerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 데이터로부터 노드와 엣지 생성
  useEffect(() => {
    if (!diagramData || !diagramData.components) {
      console.log("다이어그램 데이터가 없거나 components가 없습니다:", diagramData)
      return
    }

    console.log("다이어그램 데이터 처리 시작:", diagramData)

    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    const methodIdToNodeId: Record<string, string> = {}

    // 컴포넌트(클래스, 인터페이스) 노드 생성
    diagramData.components.forEach((component, index) => {
      const componentNodeId = `component-${component.componentId}`

      // 기본 위치 값 설정 (positionX, positionY가 undefined인 경우 사용)
      const posX = component.positionX ?? index * 400 + 100
      const posY = component.positionY ?? 150

      // 배경색 선택 (인덱스에 따라 순환)
      const backgroundColor = component.type === "CLASS" ? backgroundColors[index % backgroundColors.length] : "rgba(230, 230, 250, 0.2)" // 인터페이스는 더 연한 색상

      // 컴포넌트 노드 추가
      newNodes.push({
        id: componentNodeId,
        type: component.type.toLowerCase(),
        position: { x: posX, y: posY },
        data: {
          label: component.name,
          description: component.description,
          backgroundColor, // 배경색 데이터로 전달
        },
        style: {
          width: 350,
          height: (component.methods?.length || 0) * 150 + 100 + 80,
          backgroundColor, // 배경색 적용
          padding: "10px",
        },
      })

      // 메서드 노드 추가
      if (component.methods) {
        component.methods.forEach((method, methodIndex) => {
          const methodNodeId = `method-${method.methodId}`
          methodIdToNodeId[method.methodId] = methodNodeId

          // 메서드 간 간격 조정
          const yPosition = 100 + methodIndex * 150

          newNodes.push({
            id: methodNodeId,
            type: "method",
            position: { x: 25, y: yPosition },
            data: {
              signature: method.signature,
              body: method.body || "",
              description: method.description || "",
              isInterface: component.type === "INTERFACE",
              isExpanded: false,
            },
            parentNode: componentNodeId,
            extent: "parent",
          })
        })
      }
    })

    // 연결(엣지) 생성
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
  }, [diagramData, setNodes, setEdges])

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={false}
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
