"use client"

import Link from "next/link"
import { useMemo } from "react"
import styles from "./project-card.module.css"

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

// 파스텔 배경색 배열
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
    <Link href={`/project/${project.id}`} className={styles.projectCard} style={{ backgroundColor }}>
      <h2 className={styles.projectTitle}>{project.title}</h2>
      <p className={styles.projectDescription}>{project.description}</p>
      <div className={styles.projectDate}>{project.createdAt}</div>
    </Link>
  )
}
