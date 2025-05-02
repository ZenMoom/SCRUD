"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
export default function Header() {
  // 로고 이미지 경로
  const logoPath = "/next.svg"
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
            <button className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors" onClick={() => setShowDevMenu(!showDevMenu)}>
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
                  <li>
                    <Link href="/test" className="block px-4 py-3 hover:bg-gray-100 text-gray-800">
                      API 테스트 페이지
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors" onClick={() => console.log("로그인 버튼 클릭")}>
            로그인
          </button>
        </div>
      </div>
    </header>
  )
}
