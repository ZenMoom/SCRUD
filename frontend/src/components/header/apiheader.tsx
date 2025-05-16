// components/project/ProjectApiHeader.tsx
"use client"

import { useRouter } from "next/navigation"

interface ProjectApiHeaderProps {
  projectTitle: string
}

export default function ProjectApiHeader({ projectTitle }: ProjectApiHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 왼쪽: 뒤로가기 버튼과 프로젝트 제목 */}
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="뒤로 가기">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center">
            <h1 className="text-lg font-medium text-gray-800">{projectTitle}</h1>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-sm text-gray-500">API 편집</span>
          </div>
        </div>

        {/* 오른쪽: 저장 버튼 등 추가 기능 */}
        <div className="flex items-center space-x-3">
          <button className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors">저장</button>
        </div>
      </div>
    </header>
  )
}
