"use client"

import { useState, FormEvent } from "react"
import EmojiPicker from "./emoji-picker"
import { Project } from "./project-card"

interface ProjectFormProps {
  project?: Project // 편집 모드일 경우 기존 프로젝트 정보
  onSubmit: (projectData: Omit<Project, "id" | "createdAt">) => Promise<void>
  onCancel: () => void
  onDelete?: (id: string) => Promise<void> // 삭제 기능 추가
  isSubmitting?: boolean
}

export default function ProjectForm({ project, onSubmit, onCancel, onDelete, isSubmitting = false }: ProjectFormProps) {
  // 초기값 설정 (새 프로젝트 또는 기존 프로젝트 편집)
  const [title, setTitle] = useState(project?.title || "")
  const [description, setDescription] = useState(project?.description || "")
  const [emoji, setEmoji] = useState(project?.emoji || "📊")
  const [serverUrl, setServerUrl] = useState(project?.serverUrl || "")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 폼 제출 처리
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // 필수 입력값 검증
    if (!title.trim()) {
      alert("프로젝트 제목을 입력해주세요.")
      return
    }

    // 프로젝트 데이터 준비
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      emoji,
      serverUrl: serverUrl.trim()
    }

    // 부모 컴포넌트의 제출 함수 호출
    await onSubmit(projectData)
  }

  // 삭제 확인 표시
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // 삭제 실행
  const handleConfirmDelete = async () => {
    if (project && onDelete) {
      await onDelete(project.id)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {!showDeleteConfirm ? (
        // 프로젝트 편집 폼
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">{project ? "프로젝트 편집" : "새 프로젝트 만들기"}</h2>

          {/* 이모지 선택 */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">프로젝트 아이콘</label>
            <EmojiPicker selectedEmoji={emoji} onEmojiSelect={setEmoji} />
          </div>

          {/* 프로젝트 제목 */}
          <div className="mb-6">
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">
              프로젝트 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로젝트 제목을 입력하세요"
              maxLength={50}
              required
            />
          </div>

          {/* 프로젝트 설명 */}
          <div className="mb-6">
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
              프로젝트 설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
              rows={4}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/200자 (카드에는 처음 50자만 표시됩니다)</p>
          </div>

          {/* 서버 URL */}
          <div className="mb-6">
            <label htmlFor="serverUrl" className="block mb-2 text-sm font-medium text-gray-700">
              서버 URL
            </label>
            <input
              type="text"
              id="serverUrl"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="서버 URL을 입력하세요"
            />
          </div>

          {/* 버튼 그룹 */}
          <div className="flex justify-between">
            {/* 삭제 버튼 (편집 모드인 경우만 표시) */}
            {project && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                disabled={isSubmitting}
              >
                삭제
              </button>
            )}

            {/* 저장 및 취소 버튼 */}
            <div className="flex space-x-3 ml-auto">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isSubmitting}>
                취소
              </button>
              <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400" disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : project ? "저장" : "만들기"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        // 삭제 확인 화면
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">프로젝트 삭제</h2>
          <p className="mb-6 text-gray-600">
            정말로 <span className="font-semibold">{project?.title}</span> 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isSubmitting}>
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "처리 중..." : "삭제"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
