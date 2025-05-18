"use client"

import Link from "next/link"
import { useMemo } from "react"

// 프로젝트 타입 정의
export interface Project {
  id: string
  title: string
  description: string
  createdAt: string
  emoji?: string // 이모지 필드 추가 (선택적)
  serverUrl?: string // 서버 URL 추가
}

interface ProjectCardProps {
  project: Project
  index?: number // 카드 순서 인덱스 (색상 결정에 사용)
  onDelete?: (id: string) => void // 삭제 핸들러 추가
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

// 기본 이모지 배열 - 프로젝트 ID에 따라 랜덤하게 선택됨
const defaultEmojis = ["📊", "📈", "🚀", "💡", "✨", "🔍", "📱", "💻", "🎨", "🛠️", "📝", "🎯", "🧩", "⚙️", "📚", "🔬", "🏆", "🌟", "📦", "🔮"]

// 프로젝트 카드 컴포넌트
export default function ProjectCard({ project, index = 0, onDelete }: ProjectCardProps) {
  // 카드 마다 랜덤한 파스텔 색상 지정 (컴포넌트가 리렌더링되어도 색상 유지)
  const backgroundColor = useMemo(() => {
    // index가 있으면 index 기반으로, 없으면 프로젝트 ID 기반으로 색상 결정
    if (index !== undefined) {
      return pastelColors[index % pastelColors.length]
    }
    // 기존 ID 기반 색상 선택 로직은 fallback으로 유지
    const colorIndex = project.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length
    return pastelColors[colorIndex]
  }, [project.id, index])

  // 프로젝트 ID 기반으로 결정적인 이모지 선택 (emoji가 없을 경우에만)
  const projectEmoji = useMemo(() => {
    if (project.emoji) return project.emoji
    const emojiIndex = project.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaultEmojis.length
    return defaultEmojis[emojiIndex]
  }, [project.id, project.emoji])

  // 설명 텍스트 2줄로 제한 (최대 50자)
  const truncatedDescription = useMemo(() => {
    // 설명의 처음 50자만 사용
    if (project.description.length <= 50) return project.description
    return project.description.substring(0, 50) + "..."
  }, [project.description])

  return (
    <Link
      href={`/project/${project.id}/api`}
      className="flex flex-col p-6 h-[240px] rounded-xl text-inherit no-underline border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] hover:z-10"
      style={{ backgroundColor }}
    >
      {/* 이모지와 제목 */}
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-semibold text-gray-800 truncate max-w-[80%]">{project.title}</h2>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (window.confirm('이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  onDelete(project.id)
                }
              }}
              className="text-black hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="text-2xl ml-2 flex-shrink-0">{projectEmoji}</div>
        </div>
      </div>

      {/* 설명 (2줄로 제한) */}
      <div className="flex-grow mb-4 h-[40px] overflow-hidden">
        <p className="text-sm leading-tight text-gray-600 max-h-[40px]">{truncatedDescription}</p>
      </div>

      {/* 날짜와 API 편집 문구 */}
      <div className="flex justify-between items-center mt-auto">
        <div className="text-xs text-gray-500">{project.createdAt}</div>
        <div className="flex items-center text-sm text-blue-600 font-medium">
          API 편집
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
