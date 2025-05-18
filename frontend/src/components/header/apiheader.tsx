"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import useAuthStore from "../../app/store/useAuthStore"
import { Pencil } from "lucide-react"

interface ProjectInfo {
  id: number
  title: string
  description?: string
  serverUrl?: string
}

interface ApiHeaderProps {
  project: ProjectInfo
}

export default function ApiHeader({ project }: ApiHeaderProps) {
  // 로고 이미지 경로
  const logoPath = "/faviconblack.png"
  // 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editedProject, setEditedProject] = useState<ProjectInfo>(project)

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  // 프로젝트 정보 수정 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedProject(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 저장 버튼 핸들러
  const handleSave = () => {
    console.log('저장 버튼 눌림', editedProject)
    setShowModal(false)
  }

  // 취소 버튼 핸들러
  const handleCancel = () => {
    setEditedProject(project) // 원래 데이터로 복구
    setShowModal(false)
  }

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = useCallback(() => {
    router.push("/login")
  }, [router])

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout()
    setShowProfileMenu(false)
    router.push("/login")
  }, [logout, router])

  // 클릭 이벤트 핸들러 (드롭다운 외부 클릭 시 닫기)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showProfileMenu && !target.closest(".profile-menu-container")) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileMenu])

  // 모달이 열릴 때마다 editedProject 초기화
  useEffect(() => {
    if (showModal) {
      setEditedProject(project)
    }
  }, [showModal, project])

  return (
    <>
      <header className="sticky top-1 w-full h-[60px] bg-blue-50 z-50">
        <div className="flex items-center justify-between h-full w-full px-4">
          {/* 로고 및 프로젝트명 영역 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="cursor-pointer">
              <Image src={logoPath || "/placeholder.svg"} alt="로고" width={40} height={32} priority />
            </Link>

            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800 truncate max-w-[200px]">{project.title}</h2>
              <button
                onClick={() => setShowModal(true)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="프로젝트 정보 보기"
              >
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 우측 영역 - 사용자 정보 */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="relative profile-menu-container">
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center focus:outline-none">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                      {user.profileImgUrl ? (
                        <Image src={user.profileImgUrl || "/placeholder.svg"} alt="프로필" width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-50 w-48 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.username || "사용자"}</p>
                      </div>
                      <ul>
                        <li>
                          <button onClick={handleLogout} className="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
                            로그아웃
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={handleLoginClick} className="px-6 py-2 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-200">
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 프로젝트 정보 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-lg w-[500px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">프로젝트 정보</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 명</label>
                <input
                  type="text"
                  name="title"
                  value={editedProject.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 설명</label>
                <textarea
                  name="description"
                  value={editedProject.description || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">서버 URL</label>
                <input
                  type="text"
                  name="serverUrl"
                  value={editedProject.serverUrl || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
