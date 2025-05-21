"use client"

import { MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import useAuthStore from "../../app/store/useAuthStore"

export default function Header() {
  // 로고 이미지 경로
  const logoPath = "/logo.png"
  // 개발자 메뉴 상태 관리
  const [showDevMenu, setShowDevMenu] = useState(false)
  // 프로필 메뉴 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  // 헤더 표시 여부 상태
  const [showHeader, setShowHeader] = useState(true)

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // 현재 경로 확인 및 헤더 표시 여부 결정
  useEffect(() => {
    // 현재 경로가 canvas/{projectId}/{apiId} 패턴인지 확인
    const isCanvasRoute = pathname && /^\/canvas\/[^/]+\/[^/]+/.test(pathname);
    const isProjectApiRoute = pathname && /^\/project\/[^/]+\/api/.test(pathname);
    const isGlobalSettingRoute = pathname && /^\/globalsetting/.test(pathname);
    // canvas, project/api, globalsetting 경로에서는 헤더를 표시하지 않음
    setShowHeader(!isCanvasRoute && !isProjectApiRoute && !isGlobalSettingRoute);
  }, [pathname]);

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = useCallback(() => {
    router.push("/login")
  }, [router])

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout()
    setShowProfileMenu(false)
    router.push("/")
  }, [logout, router])

  // 클릭 이벤트 핸들러 (드롭다운 외부 클릭 시 닫기)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // 개발자 메뉴 외부 클릭 시 메뉴 닫기
      if (showDevMenu && !target.closest(".dev-menu-container")) {
        setShowDevMenu(false)
      }

      // 프로필 메뉴 외부 클릭 시 메뉴 닫기
      if (showProfileMenu && !target.closest(".profile-menu-container")) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDevMenu, showProfileMenu])

  // 헤더를 표시하지 않는 경우 null 반환
  if (!showHeader) {
    return null
  }

  return (
    <header className="h-[60px] sticky top-0 z-50 w-full bg-white">
      <div className=" flex items-center justify-between w-full h-full">
        {/* 로고 영역 */}
        <div className="flex items-center ml-4">
          <Link href="/" className="cursor-pointer">
            <Image src={logoPath || "/placeholder.svg"} alt="로고" width={120} height={40} priority />
          </Link>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-4 mr-4">
          {/* 로그인 버튼 또는 프로필 아이콘 */}
          <div className="flex items-center gap-4 mr-4">
            {/* 피드백 버튼 */}
            <button onClick={() => router.push("/feedback")} className="hover:bg-gray-100 flex items-center gap-1 px-2 py-1 text-xs text-gray-700 transition border border-gray-300 rounded-md">
              <MessageCircle className="w-4 h-4" />
              <span className="sm:inline hidden">피드백</span>
            </button>

            {isAuthenticated && user ? (
              <div className="profile-menu-container relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="focus:outline-none flex items-center">
                  <div className="hover:border-gray-300 w-10 h-10 overflow-hidden transition-colors border-2 border-gray-200 rounded-full">
                    {user.profileImgUrl ? (
                      <Image src={user.profileImgUrl || "/placeholder.svg"} alt="프로필" width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-500 bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="top-full absolute right-0 z-50 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.username || "사용자"}</p>
                    </div>
                    <ul>
                      <li>
                        <button onClick={handleLogout} className="hover:bg-gray-100 block w-full px-4 py-3 text-sm text-left text-gray-700">
                          로그아웃
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="hover:bg-black hover:text-white px-6 py-2 font-bold tracking-wider text-black uppercase transition-colors duration-200 border-2 border-black"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
