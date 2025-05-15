"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CheckCircle, XCircle, Plus, Pencil, X } from "lucide-react"
import useAuthStore from "@/app/store/useAuthStore"
import { useParams } from "next/navigation"
import FileInputModal from "./file-modal/FileInputModal"

// 전역 파일 정의
interface GlobalFile {
  globalFileId: number
  fileName: string
  fileType: string
  fileUrl?: string
  fileContent: string
}

// 파일 타입별로 그룹화된 파일
interface GlobalFilesByType {
  [key: string]: GlobalFile[]
}

// 왼쪽 컨테이너 Props
interface LeftContainerProps {
  completed: Record<string, boolean>
  activeItem: string
  onItemClick: (item: string) => void
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

export default function LeftContainer({ activeItem, onItemClick }: LeftContainerProps) {
  const [files, setFiles] = useState<GlobalFilesByType>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFileType, setSelectedFileType] = useState<string>("")
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const { token } = useAuthStore()
  const params = useParams()
  const projectId = params.id ? parseInt(params.id as string, 10) : 0

  // 파일 항목 목록 - 컴포넌트 내에서 계산
  const fileItems = ITEMS.filter((item): item is FileItem => !item.isProject)

  // 파일 타입별 그룹화 함수
  const groupFilesByType = useCallback(
    (files: GlobalFile[]): GlobalFilesByType => {
      const result: GlobalFilesByType = {}

      // 초기화 - 모든 파일 타입에 대한 빈 배열 생성
      fileItems.forEach((item) => {
        result[item.fileType] = []
      })

      // 파일 분류
      files.forEach((file) => {
        const fileType = file.fileType
          .split("_")
          .slice(0, file.fileType.startsWith("ARCHITECTURE") ? 2 : 1)
          .join("_")
        if (result[fileType]) {
          result[fileType].push(file)
        } else if (fileType.startsWith("ARCHITECTURE")) {
          result["ARCHITECTURE_DEFAULT"].push(file)
        } else if (fileType.startsWith("SECURITY")) {
          result["SECURITY"].push(file)
        } else if (fileType.startsWith("CONVENTION")) {
          result["CONVENTION"].push(file)
        } else {
          console.warn(`Unknown file type: ${fileType}`, file)
        }
      })

      return result
    },
    [fileItems]
  )

  // 전역 파일 데이터 로드 함수
  const fetchGlobalFiles = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: token || "",
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching global files: ${response.status}`)
      }

      const data = await response.json()

      // 백엔드 응답 구조에 따라 조정 필요
      const globalFiles = data.content || data.globalFiles || []
      setFiles(groupFilesByType(globalFiles))
    } catch (err) {
      console.error("Failed to fetch global files:", err)
    } finally {
      setLoading(false)
    }
  }, [projectId, token, groupFilesByType])

  // 최초 로드 시에만 데이터 가져오기
  useEffect(() => {
    fetchGlobalFiles()
  }, []) // 의존성 배열을 비워서 최초 마운트 시에만 실행

  // 전역 파일 삭제 처리 함수
  const handleDeleteFile = async (globalFileId: number | undefined) => {
    if (!projectId || !token) return

    // globalFileId가 없으면 함수 종료
    if (globalFileId === undefined || globalFileId === null) {
      console.error("파일 ID가 존재하지 않습니다.")
      alert("파일 ID가 존재하지 않아 삭제할 수 없습니다.")
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/${globalFileId}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      })

      if (!response.ok) {
        throw new Error(`Error deleting file: ${response.status}`)
      }

      // 삭제 후 데이터 다시 불러오기
      fetchGlobalFiles()
    } catch (err) {
      console.error("Failed to delete file:", err)
      alert("파일 삭제에 실패했습니다.")
    }
  }

  // 아이템 펼치기/접기
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // 아이템에 파일이 있는지 확인
  const hasFiles = (fileType: string): boolean => {
    return files[fileType] && files[fileType].length > 0
  }

  // 파일 추가 핸들러
  const handleAddFile = (fileType: string) => {
    setSelectedFileType(fileType)
    setIsModalOpen(true)
  }

  // 파일 업로드 성공 핸들러
  const handleUploadSuccess = () => {
    setIsModalOpen(false)
    fetchGlobalFiles()
  }

  // 프로젝트 정보 수정 핸들러 (추후 구현)
  const handleEditProject = (field: string) => {
    console.log(`Edit project ${field}`)
    // 추후 API 구현 시 여기에 추가
  }

  // 아이템 클릭 처리 - 아코디언 토글 및 onItemClick 호출
  const handleItemClick = (id: string) => {
    toggleItem(id)
    onItemClick(id)
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
            {hasFilesForType ? <CheckCircle className="text-green-500 mr-2.5" size={20} /> : <XCircle className="text-red-500 mr-2.5" size={20} />}
            <span className="text-base font-medium">{label}</span>
          </div>
          <div className="flex items-center relative">
            <button
              ref={addButtonRef}
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation()
                handleAddFile(fileType)
              }}
            >
              <Plus size={18} className="text-blue-500" />
            </button>
            {isModalOpen && selectedFileType === fileType && (
              <FileInputModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fileType={selectedFileType}
                projectId={projectId}
                onSuccess={handleUploadSuccess}
              />
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="p-2 bg-white">
            {loading ? (
              <div className="pl-8 py-2 text-sm text-gray-500">로딩 중...</div>
            ) : hasFilesForType ? (
              <ul className="space-y-1">
                {files[fileType].map((file) => (
                  <li key={file.globalFileId} className="pl-8 py-2 text-sm hover:bg-gray-50 rounded flex justify-between items-center">
                    <span>{file.fileName}</span>
                    <button
                      className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log("삭제할 파일 정보:", { id: file.globalFileId, name: file.fileName, type: fileType })
                        handleDeleteFile(file.globalFileId)
                      }}
                    >
                      <X size={16} />
                    </button>
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

  // 프로젝트 항목 렌더링 함수
  const renderProjectItem = (item: ProjectItem) => {
    const { id, label } = item

    return (
      <div key={id} className="mb-2">
        <div
          className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 rounded-lg
          ${activeItem === id ? "bg-gray-100 font-medium" : ""}`}
          onClick={() => handleItemClick(id)}
        >
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2.5" size={20} />
            <span className="text-base font-medium">{label}</span>
          </div>
          <div className="flex items-center">
            <button
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={(e) => {
                e.stopPropagation()
                handleEditProject(id)
              }}
            >
              <Pencil size={18} className="text-blue-500" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <h2 className="text-lg font-bold text-gray-800 mb-4">프로젝트 설정</h2>
      <div className="space-y-2">
        {ITEMS.map((item) => (item.isProject ? renderProjectItem(item) : renderFileItem(item as FileItem)))}
      </div>
    </div>
  )
}
