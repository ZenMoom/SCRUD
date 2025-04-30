"use client"

import Link from "next/link"
import { useMemo } from "react"

// 프로젝트 타입 정의
export interface Project {
  id: string
  title: string
  description: string
  createdAt: string
}

interface ProjectCardProps {
  project: Project
}

// 더 진한 파스텔 배경색 배열
const pastelColors = [
  "#CCE5FF", // 더 진한 파랑
  "#CCFFF1", // 더 진한 민트
  "#DEFFDD", // 더 진한 초록
  "#FFF2CC", // 더 진한 노랑
  "#FFDDDD", // 더 진한 빨강
  "#F3D9FF", // 더 진한 보라
  "#FFD9E6", // 더 진한 분홍
  "#D9E5FF", // 더 진한 인디고
  "#FFE6CC", // 더 진한 주황
  "#E6E6FF", // 더 진한 라벤더
]

export default function ProjectCard({ project }: ProjectCardProps) {
  // 카드 마다 랜덤한 파스텔 색상 지정 (컴포넌트가 리렌더링되어도 색상 유지)
  const backgroundColor = useMemo(() => {
    // 프로젝트 ID 기반으로 결정적인 색상 선택 (같은 ID면 항상 같은 색상)
    const colorIndex = project.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length
    return pastelColors[colorIndex]
  }, [project.id])

  return (
    <Link
      href={`/project/${project.id}`}
      className="flex flex-col p-6 h-[200px] rounded-lg text-inherit no-underline shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor }}
    >
      <h2 className="text-xl font-semibold mb-3 text-gray-800">{project.title}</h2>
      <p className="text-sm leading-relaxed text-gray-600 flex-grow overflow-hidden line-clamp-2 mb-4">{project.description}</p>
      <div className="text-xs text-gray-500 text-right">{project.createdAt}</div>
    </Link>
  )
}
