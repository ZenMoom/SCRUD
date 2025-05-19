"use client"

import { useState } from "react"
import FileContentModal from "./FileContentModal"

// 전역 파일 정의
interface GlobalFile {
  globalFileId: number
  fileName: string
  fileType: string
  fileUrl?: string
  fileContent: string
}

// 왼쪽 컨테이너 Props
interface LeftContainerProps {
  completed: Record<string, boolean>
  activeItem: string
  onItemClick: (item: string) => void
  globalFiles: GlobalFile[]
}

// 프로젝트 항목 타입
type ProjectItem = {
  id: string
  label: string
  isProject: true
}

// 파일 항목 타입
type FileItem = {
  id: string
  label: string
  fileType: string
  isProject: false
}

// 사이드바 항목 타입 (프로젝트 항목 또는 파일 항목)
type SidebarItem = ProjectItem | FileItem

// 아이템 정의 - 파일 타입 카테고리는 고정이므로 컴포넌트 외부로 이동
const ITEMS: SidebarItem[] = [
  { id: "requirementSpec", label: "요구사항 명세서", fileType: "REQUIREMENTS", isProject: false },
  { id: "erd", label: "ERD", fileType: "ERD", isProject: false },
  { id: "dependencyFile", label: "의존성 파일", fileType: "DEPENDENCY", isProject: false },
  { id: "utilityClass", label: "유틸 클래스", fileType: "UTIL", isProject: false },
  { id: "errorCode", label: "에러 코드", fileType: "ERROR_CODE", isProject: false },
  { id: "securitySetting", label: "보안 설정", fileType: "SECURITY", isProject: false },
  { id: "codeConvention", label: "코드 컨벤션", fileType: "CONVENTION", isProject: false },
  { id: "architectureStructure", label: "아키텍처 구조", fileType: "ARCHITECTURE_DEFAULT", isProject: false },
]

export default function LeftContainer({ activeItem, onItemClick, globalFiles }: LeftContainerProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [loading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<GlobalFile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 아이템 펼치기/접기
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // 아이템에 파일이 있는지 확인
  const hasFiles = (fileType: string): boolean => {
    return globalFiles.some(file => file.fileType === fileType)
  }

  // 아이템 클릭 처리 - 아코디언 토글 및 onItemClick 호출
  const handleItemClick = (id: string) => {
    toggleItem(id)
    onItemClick(id)
  }

  // 프로젝트 항목 렌더링 함수
  const renderProjectItem = (item: ProjectItem) => {
    const { id, label } = item
    const isExpanded = expandedItems[id]
    const value = globalFiles.find(file => file.fileType === id.toUpperCase())?.fileContent || ''

    return (
      <div key={id} className="mb-2">
        <div
          className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 rounded-lg
          ${activeItem === id ? "bg-gray-100 font-medium" : ""}`}
          onClick={() => handleItemClick(id)}
        >
          <div className="flex items-center">
            <span className="text-base font-medium">{label}</span>
          </div>
        </div>
        {isExpanded && (
          <div className="p-2 bg-white">
            <div className="pl-8 py-2 text-sm text-gray-700">
              {value || '정보가 없습니다'}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 파일 항목 렌더링 함수
  const renderFileItem = (item: FileItem) => {
    const { id, label, fileType } = item
    const isExpanded = expandedItems[id]
    const hasFilesForType = hasFiles(fileType)

    return (
      <div key={id} className="mb-2">
        <div
          className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 rounded-lg
          ${activeItem === id ? "bg-gray-100 font-medium" : ""}`}
          onClick={() => handleItemClick(id)}
        >
          <div className="flex items-center">
            <span className="text-base font-medium">{label}</span>
          </div>
        </div>
        {isExpanded && (
          <div className="p-2 bg-white">
            {loading ? (
              <div className="pl-8 py-2 text-sm text-gray-500">로딩 중...</div>
            ) : hasFilesForType ? (
              <ul className="space-y-1">
                {globalFiles
                  .filter(file => file.fileType === fileType)
                  .map((file) => (
                    <li key={file.globalFileId} className="pl-8 py-2 text-sm hover:bg-gray-50 rounded flex justify-between items-center">
                      <span 
                        className="cursor-pointer hover:text-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          setIsModalOpen(true);
                        }}
                      >
                        {file.fileName}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="pl-8 py-2 text-sm text-gray-500">파일이 없습니다</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <h2 className="text-lg font-bold text-gray-800 mb-4">프로젝트 설정</h2>
      <div className="space-y-2">
        {ITEMS.map((item) => (
          item.isProject ? renderProjectItem(item as ProjectItem) : renderFileItem(item as FileItem)
        ))}
      </div>
      <FileContentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
        }}
        fileName={selectedFile?.fileName || ""}
        content={selectedFile?.fileContent || ""}
      />
    </div>
  )
}
