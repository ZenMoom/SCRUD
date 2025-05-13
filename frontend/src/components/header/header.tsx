"use client"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useAuthStore from "../../app/store/useAuthStore"

export default function Header() {
  // 로고 이미지 경로
  const logoPath = "/logo.png"
  // 개발자 메뉴 상태 관리
  const [showDevMenu, setShowDevMenu] = useState(false)
  // 프로필 메뉴 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = () => {
    router.push("/login")
  }

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    router.push("/login")
  }

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

  return (
    <header className="sticky top-0 w-full h-[70px] bg-white z-50 ">
      <div className="flex items-center justify-between h-full w-full px-[5%]">
        {/* 로고 영역 */}
        <div className="flex items-center ml-4">
          <Link href="/" className="cursor-pointer">
            <Image src={logoPath} alt="로고" width={120} height={40} priority />
          </Link>
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-4 mr-4">
          {/* 개발자 메뉴 드롭다운 */}
          {/* <div className="relative dev-menu-container">
            <button
              onClick={() => setShowDevMenu(!showDevMenu)}
              className="px-6 py-2 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-200"
            >
              개발 메뉴
            </button>

            {showDevMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-50 w-48 border border-gray-200">
                <ul>
                  <li>
                    <Link href="/project/api" className="block px-4 py-3 hover:bg-gray-100 text-gray-800 border-b border-gray-100">
                      API 제작 페이지
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div> */}

          {/* 로그인 버튼 또는 프로필 아이콘 */}
          {isAuthenticated && user ? (
            <div className="relative profile-menu-container">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center focus:outline-none">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  {user.profileImgUrl ? (
                    <Image src={user.profileImgUrl} alt="프로필" width={40} height={40} className="object-cover w-full h-full" />
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
          ) : (
            <button onClick={handleLoginClick} className="px-6 py-2 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-200">
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
