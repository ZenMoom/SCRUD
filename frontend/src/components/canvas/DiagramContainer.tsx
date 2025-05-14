"use client"

import type React from "react"

import { useCallback, useEffect, useState, useRef } from "react"
import ReactFlow, { Background, Controls, type Edge, type Node as ReactFlowNode, useNodesState, useEdgesState, MiniMap, Panel, NodeToolbar, Position } from "reactflow"
import { Map, MapPinOffIcon as MapOff, Target, X, ChevronDown, Clock } from "lucide-react"
import "reactflow/dist/style.css"
import type { DiagramResponse, DiagramDto, ComponentDto, ConnectionDto } from "@generated/model"
import { MethodNode } from "./nodes/MethodNode"
import { ClassNode } from "./nodes/ClassNode"
import { InterfaceNode } from "./nodes/InterfaceNode"
import { CustomEdge } from "./edges/CustomEdge"
import DtoContainer from "./DtoContainer"

// 미리 정의된 배경색 배열 추가 (파스텔톤으로 구성)
const backgroundColors = [
  "rgba(255, 228, 225, 0.4)", // 연한 분홍색
  "rgba(230, 230, 250, 0.4)", // 연한 라벤더색
  "rgba(255, 245, 238, 0.4)", // 연한 씨쉘색
  "rgba(240, 255, 240, 0.4)", // 연한 허니듀색
  "rgba(255, 250, 205, 0.4)", // 연한 레몬 쉬폰색
  "rgba(245, 255, 250, 0.4)", // 연한 민트 크림색
  "rgba(240, 248, 255, 0.4)", // 연한 앨리스 블루색
  "rgba(255, 240, 245, 0.4)", // 연한 라벤더 블러쉬색
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
const METHOD_VERTICAL_SPACING = 70 // 메서드 간 수직 간격 (증가)
const CLASS_PADDING_TOP = 150 // 클래스 상단 패딩 (제목 영역) (증가)
const CLASS_PADDING_BOTTOM = 90 // 클래스 하단 패딩 (증가)
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

// 노드 관계 맵 타입 정의
interface NodeRelationMap {
  [nodeId: string]: {
    parentId?: string
    childIds: string[]
  }
}

// 버전 정보 타입 정의
interface VersionInfo {
  versionId: string
  description: string
  timestamp?: string
}

type DiagramContainerProps = {
  diagramData: DiagramResponse | null
  loading: boolean
  error: string | null
  onSelectionChange?: (targets: TargetNode[]) => void
  selectedVersion?: string | null // 선택된 버전 ID 추가
  versions?: VersionInfo[] // 사용 가능한 버전 목록 추가
  onVersionSelect?: (versionId: string) => void // 버전 선택 콜백 추가
}

// 타입 가드 함수들
function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isNumber(value: unknown): value is number {
  return typeof value === "number"
}

// 메서드 타입 가드
function isMethodDto(method: unknown): method is ComponentDto["methods"][number] {
  if (!method || typeof method !== "object") return false
  const m = method as Record<string, unknown>
  return typeof m.methodId === "string" && typeof m.signature === "string"
}

// 컴포넌트 타입 가드
function isComponentDto(component: unknown): component is ComponentDto {
  if (!component || typeof component !== "object") return false
  const c = component as Record<string, unknown>
  return typeof c.componentId === "string" && typeof c.name === "string" && (c.type === "CLASS" || c.type === "INTERFACE") && (c.methods === undefined || Array.isArray(c.methods))
}

// 연결 타입 가드
function isConnectionDto(connection: unknown): connection is ConnectionDto {
  if (!connection || typeof connection !== "object") return false
  const c = connection as Record<string, unknown>
  return typeof c.connectionId === "string" && typeof c.sourceMethodId === "string" && typeof c.targetMethodId === "string"
}

// DiagramDto 타입 가드
function isDiagramDto(data: unknown): data is DiagramDto {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>

  // components 배열 확인
  if (d.components !== undefined && !Array.isArray(d.components)) return false

  // connections 배열 확인
  if (d.connections !== undefined && !Array.isArray(d.connections)) return false

  // dto 배열 확인
  if (d.dto !== undefined && !Array.isArray(d.dto)) return false

  // metadata 객체 확인
  if (d.metadata !== undefined && typeof d.metadata !== "object") return false

  return true
}

// 명시적으로 React.ReactElement 반환 타입 지정
export default function DiagramContainer({ diagramData, loading, error, onSelectionChange, selectedVersion, versions = [], onVersionSelect }: DiagramContainerProps): React.ReactElement {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [targetNodes, setTargetNodes] = useState<TargetNode[]>([])
  const [showToolbar, setShowToolbar] = useState<string | null>(null)

  // DTO 패널 상태
  const [showDtoPanel, setShowDtoPanel] = useState<boolean>(true)

  // 노드 관계 맵 (부모-자식 관계)
  const [nodeRelationMap, setNodeRelationMap] = useState<NodeRelationMap>({})

  // MiniMap 표시 여부를 제어하는 상태 추가
  const [showMiniMap, setShowMiniMap] = useState(true)

  // 노드 초기 위치를 저장할 상태 추가
  const [initialNodePositions, setInitialNodePositions] = useState<Record<string, { x: number; y: number }>>({})

  // 현재 버전 정보 상태 추가
  const [currentVersionInfo, setCurrentVersionInfo] = useState<VersionInfo | null>(null)

  // 버전 목록 상태 추가
  const [showVersions, setShowVersions] = useState<boolean>(false)
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([])

  // 버전 목록 참조 (외부 클릭 감지용)
  const versionsRef = useRef<HTMLDivElement>(null)

  // 현재 버전 계산
  const currentVersion = (() => {
    if (selectedVersion) return selectedVersion

    if (!diagramData || !diagramData.metadata) return "1"

    const version = diagramData.metadata
    if (isNumber(version)) return version.toString()
    if (isString(version)) return version
    return "1"
  })()

  // 사용 가능한 버전 목록 업데이트
  useEffect(() => {
    if (versions && versions.length > 0) {
      // 부모 컴포넌트에서 전달받은 모든 버전을 그대로 사용
      setAvailableVersions(versions)
    }
  }, [versions])

  // 현재 버전 정보 업데이트
  useEffect(() => {
    if (diagramData && diagramData.metadata) {
      const metadata = diagramData.metadata

      setCurrentVersionInfo({
        versionId: isString(metadata.version) ? metadata.version : isNumber(metadata.version) ? metadata.version.toString() : "1",
        description: metadata.description || "버전 설명 없음",
        timestamp: metadata.lastModified,
      })
    }
  }, [diagramData])

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
    (node: ReactFlowNode) => {
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
          name: node.data?.name || node.id,
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
                  name: childNode.data?.name || childId,
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
    (components: ComponentDto[], expandedNodeIds: Set<string>, savedPositions: Record<string, { x: number; y: number }>) => {
      const newNodes: ReactFlowNode[] = []
      const methodIdToNodeId: Record<string, string> = {}
      const updatedPositions: Record<string, { x: number; y: number }> = { ...savedPositions }
      const newNodeRelationMap: NodeRelationMap = {}

      // 중복 노드 ID 추적을 위한 Set
      const processedComponentIds = new Set<string>()
      const processedMethodIds = new Set<string>()

      // 각 컴포넌트(클래스/인터페이스)에 대해 처리
      components.forEach((component, componentIndex) => {
        if (!isComponentDto(component)) return

        const componentId = component.componentId
        if (!componentId) return // componentId가 없으면 처리하지 않음

        // 중복 컴포넌트 ID 체크
        const componentNodeId = `component-${componentId}`
        if (processedComponentIds.has(componentNodeId)) {
          console.warn(`중복된 컴포넌트 ID 감지: ${componentNodeId}. 이 컴포넌트는 건너뜁니다.`)
          return
        }
        processedComponentIds.add(componentNodeId)

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
        const methodNodes: ReactFlowNode[] = []

        if (component.methods && Array.isArray(component.methods)) {
          component.methods.forEach((method) => {
            if (!isMethodDto(method)) return

            // methodId가 없으면 처리하지 않음
            const methodId = method.methodId
            if (!methodId) return

            const methodNodeId = `method-${methodId}`

            // 중복 메서드 ID 체크 (같은 컴포넌트 내에서만)
            const uniqueMethodId = `${componentNodeId}-${methodNodeId}`
            if (processedMethodIds.has(uniqueMethodId)) {
              console.warn(`중복된 메서드 ID 감지: ${methodNodeId} in ${componentNodeId}. 이 메서드는 건너뜁니다.`)
              return
            }
            processedMethodIds.add(uniqueMethodId)

            methodIdToNodeId[methodId] = methodNodeId

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
                showCheckIcon: isTargeted, // 체크 아이콘 표시 여부
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
            description: component.description || "",
            backgroundColor,
            name: component.name,
            isTargeted, // 타겟 노드 여부 전달
            showCheckIcon: isTargeted, // 체크 아이콘 표시 여부
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
    if (!diagramData) {
      console.log("다이어그램 데이터가 없습니다:", diagramData)
      return
    }

    if (!isDiagramDto(diagramData)) {
      console.error("다이어그램 데이터 형식이 올바르지 않습니다:", diagramData)
      return
    }

    if (!diagramData.components || !Array.isArray(diagramData.components) || diagramData.components.length === 0) {
      console.log("다이어그램 컴포넌트 데이터가 없습니다:", diagramData)
      return
    }

    console.log("다이어그램 데이터 처리 시작:", diagramData)

    // 컴포넌트 배열 필터링 (유효한 컴포넌트만 사용)
    const validComponents = diagramData.components.filter(isComponentDto)

    // 중복 컴포넌트 제거 (componentId 기준)
    const uniqueComponents = validComponents.reduce<ComponentDto[]>((acc, component) => {
      if (!acc.some((c) => c.componentId === component.componentId)) {
        acc.push(component)
      } else {
        console.warn(`중복된 컴포넌트 ID 감지: ${component.componentId}. 첫 번째 발견된 컴포넌트만 사용합니다.`)
      }
      return acc
    }, [])

    console.log(`총 ${validComponents.length}개의 컴포넌트 중 ${uniqueComponents.length}개의 고유 컴포넌트 처리`)

    // 노드 레이아웃 계산 (초기 위치 전달)
    const { newNodes, methodIdToNodeId, updatedPositions } = calculateLayout(uniqueComponents, expandedNodes, initialNodePositions)

    // 초기 위치가 비어있는 경우에만 업데이트 (첫 렌더링 시에만)
    if (Object.keys(initialNodePositions).length === 0) {
      setInitialNodePositions(updatedPositions)
    }

    // 엣지 생성
    const newEdges: Edge[] = []
    if (diagramData.connections && Array.isArray(diagramData.connections)) {
      // 유효한 연결만 필터링
      const validConnections = diagramData.connections.filter(isConnectionDto)

      // 중복 연결 제거
      const processedConnectionIds = new Set<string>()

      validConnections.forEach((connection) => {
        // 연결 ID가 이미 처리되었는지 확인
        if (processedConnectionIds.has(connection.connectionId)) {
          console.warn(`중복된 연결 ID 감지: ${connection.connectionId}. 이 연결은 건너뜁니다.`)
          return
        }
        processedConnectionIds.add(connection.connectionId)

        // sourceMethodId와 targetMethodId가 있는지 확인
        if (!connection.sourceMethodId || !connection.targetMethodId) return

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

    // 버전 정보 업데이트
    if (diagramData.metadata) {
      const metadata = diagramData.metadata

      // 현재 버전 정보 설정
      const currentVersionInfo: VersionInfo = {
        versionId: isString(metadata.version) ? metadata.version : isNumber(metadata.version) ? metadata.version.toString() : "1",
        description: metadata.description || "버전 설명 없음",
        timestamp: metadata.lastModified,
      }

      setCurrentVersionInfo(currentVersionInfo)
    }
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
    const handleToggleExpand = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log("이벤트 수신:", customEvent.detail)
      if (customEvent.detail && customEvent.detail.nodeId) {
        toggleMethodExpand(customEvent.detail.nodeId)
      }
    }

    const handleRemoveTarget = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log("타겟 제거 이벤트 수신:", customEvent.detail)
      if (customEvent.detail && customEvent.detail.nodeId) {
        removeTargetNode(customEvent.detail.nodeId)
      }
    }

    // 버전 드롭다운 외부 클릭 감지
    const handleClickOutside = (event: MouseEvent) => {
      if (versionsRef.current && !versionsRef.current.contains(event.target as Element)) {
        setShowVersions(false)
      }
    }

    // 이벤트 리스너 등록
    document.addEventListener("toggleMethodExpand", handleToggleExpand as EventListener)
    document.addEventListener("mousedown", handleClickOutside)

    // 타겟 제거 이벤트 리스너 추가
    const diagramContainer = document.getElementById("diagram-container")
    if (diagramContainer) {
      diagramContainer.addEventListener("removeTarget", handleRemoveTarget as EventListener)
    }

    // 클린업 함수
    return () => {
      document.removeEventListener("toggleMethodExpand", handleToggleExpand as EventListener)
      document.removeEventListener("mousedown", handleClickOutside)

      if (diagramContainer) {
        diagramContainer.removeEventListener("removeTarget", handleRemoveTarget as EventListener)
      }
    }
  }, [toggleMethodExpand, removeTargetNode])

  // 노드 위치 변경 핸들러 추가 (ReactFlow의 onNodeDragStop 이벤트에 연결)
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
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

  // 노드 클릭 핸들러
  const onNodeClick = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    event.stopPropagation()
    setShowToolbar(node.id)
  }, [])

  // 배경 클릭 핸들러
  const onPaneClick = useCallback(() => {
    setShowToolbar(null)
  }, [])

  // DTO 패널 토글 핸들러
  const toggleDtoPanel = useCallback(() => {
    setShowDtoPanel((prev) => !prev)
  }, [])

  // 타겟 노드 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(targetNodes)
    }
  }, [targetNodes, onSelectionChange])

  // 버전 선택 핸들러
  const handleVersionSelect = useCallback(
    (versionId: string) => {
      if (onVersionSelect) {
        onVersionSelect(versionId)
      }
      setShowVersions(false)
    },
    [onVersionSelect]
  )

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
    <div id="diagram-container" style={{ width: "100%", height: "100%" }} className="bg-white rounded-lg shadow overflow-hidden relative">
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
        <Controls position="top-left" style={{ top: "70px" }} />

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
              <button onClick={() => removeTargetNode(node.id)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                <X size={14} />
                <span>타겟 해제</span>
              </button>
            ) : (
              <button onClick={() => addTargetNode(node)} className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                <Target size={14} />
                <span>타겟 추가</span>
              </button>
            )}
          </NodeToolbar>
        ))}

        {/* 선택된 타겟 표시 패널 */}
        <Panel position="top-left" className="ml-4 mt-4">
          <div className="bg-white px-4 py-3 rounded-md shadow-md">
            <div className="flex flex-wrap gap-2">
              {targetNodes.length > 0 ? (
                targetNodes.map((target) => (
                  <div key={target.id} className="relative group">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs max-w-[150px] overflow-hidden">
                      <span className="truncate">
                        {target.type === "class" && "클래스: "}
                        {target.type === "interface" && "인터페이스: "}
                        {target.type === "method" && "메서드: "}
                        {target.name.length > 15 ? target.name.substring(0, 15) + "..." : target.name}
                      </span>
                      <button
                        onClick={() => removeTargetNode(target.id)}
                        className="ml-1 p-0.5 rounded-full bg-green-200 hover:bg-green-300 transition-colors flex-shrink-0"
                        aria-label={`${target.name} 타겟 제거`}
                      >
                        <X size={12} className="text-green-700" />
                      </button>
                    </div>

                    {/* 호버 시 전체 이름 표시 */}
                    {target.name.length > 15 && (
                      <div className="absolute left-0 bottom-full mb-1 z-10 bg-white p-2 rounded shadow-md text-xs max-w-[300px] break-words hidden group-hover:block">
                        <span className="font-medium">
                          {target.type === "class" && "클래스: "}
                          {target.type === "interface" && "인터페이스: "}
                          {target.type === "method" && "메서드: "}
                        </span>
                        <span>{target.name}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  <span>전체 API</span>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* API 경로 표시 (오른쪽 상단) */}
        <Panel position="top-right" className="mr-4 mt-4">
          <div className="bg-white px-4 py-2 rounded-md shadow-md">
            <div className="text-sm font-medium text-green-600">[POST] api/board/create</div>
          </div>
        </Panel>

        {/* 버전 정보 패널 (오른쪽 상단) */}
        <Panel position="top-right" className="mr-4 mt-16">
          <div className="relative" ref={versionsRef}>
            <button onClick={() => setShowVersions(!showVersions)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-md hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">버전: {currentVersion}</span>
                {currentVersionInfo && <span className="text-xs text-gray-500">{currentVersionInfo.description}</span>}
              </div>
              <ChevronDown size={16} className={`text-gray-600 transition-transform ${showVersions ? "rotate-180" : ""}`} />
            </button>

            {/* 버전 드롭다운 - 버전 1부터 최신 버전까지 순서대로 표시 */}
            {showVersions && availableVersions.length > 0 && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="py-1">
                  {availableVersions.map((version) => (
                    <div
                      key={`version-${version.versionId}`}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${version.versionId === currentVersion ? "bg-blue-50" : ""}`}
                      onClick={() => handleVersionSelect(version.versionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`text-sm ${version.versionId === currentVersion ? "font-medium text-blue-700" : "text-gray-700"}`}>버전 {version.versionId}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[180px]">{version.description}</span>
                        </div>
                        {version.versionId === currentVersion && (
                          <span className="text-blue-500">
                            <Clock size={16} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* 디버그 정보 패널 */}
        <Panel position="bottom-left" className="ml-4 mb-72">
          <div className="bg-white p-2 rounded-md shadow-md text-xs">
            <div>노드 수: {nodes.length}</div>
            <div>엣지 수: {edges.length}</div>
          </div>
        </Panel>

        {/* MiniMap 토글 버튼 - 위치 조정 */}
        <Panel position="bottom-right" className="mb-72 mr-2">
          <button onClick={toggleMiniMap} className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors" title={showMiniMap ? "미니맵 숨기기" : "미니맵 표시"}>
            {showMiniMap ? <MapOff size={20} className="text-gray-600" /> : <Map size={20} className="text-gray-600" />}
          </button>
        </Panel>
      </ReactFlow>

      {/* DTO 패널 - DtoContainer 컴포넌트로 분리 */}
      <div className={`absolute bottom-0 left-0 w-[70%] transition-all duration-300 ${showDtoPanel ? "h-64" : "h-10"}`}>
        <DtoContainer diagramData={diagramData} loading={loading} isCollapsed={!showDtoPanel} onToggleCollapse={toggleDtoPanel} />
      </div>
    </div>
  )
}
