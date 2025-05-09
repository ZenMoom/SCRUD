"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
export default function Header() {
  // 로고 이미지 경로
  const logoPath = "/logo.png"
  // 개발자 메뉴 상태 관리
  const [showDevMenu, setShowDevMenu] = useState(false)
  return (
    <header className="sticky top-0 w-full h-[70px] bg-white z-50">
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
          <div className="relative">
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
          </div>
          {/* 로그인 버튼 - 로고 스타일에 맞춘 심플한 디자인 */}
          <button
            onClick={() => console.log("로그인 버튼 클릭")}
            className="px-6 py-2 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </div>
    </header>
  )
}
