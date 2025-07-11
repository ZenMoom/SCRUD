"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import useAuthStore from "@/app/store/useAuthStore"
import { MessageCircle } from "lucide-react"


export default function GlobalHeader() {
  // 로고 이미지 경로
  const logoPath = "/faviconblack.png"
  // 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout} = useAuthStore()
  const router = useRouter()

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

  return (
    <>
      <header className="h-[60px] sticky top-0 z-50 w-full bg-blue-50">
        <div className="flex items-center justify-between h-full w-full px-4">
          {/* 로고 및 프로젝트명 영역 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="cursor-pointer">
              <Image src={logoPath || "/placeholder.svg"} alt="로고" width={40} height={32} priority />
            </Link>
          </div>

          {/* 우측 영역 - 사용자 정보 */}
          <div className="flex items-center gap-3">
             <button
              onClick={() => router.push("/feedback")}
              className="hover:bg-gray-100 flex items-center gap-1 px-2 py-1 text-xs text-gray-700 transition border border-gray-300 rounded-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="sm:inline hidden">피드백</span>
            </button>
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
    </>
  )
}
