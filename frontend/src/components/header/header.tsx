"use client"

import Image from "next/image"
import Link from "next/link"

export default function Header() {
  // 로고 이미지 경로 (프로젝트에 맞게 수정 필요)
  const logoPath = "/next.svg" // 기본 Next.js 로고 경로로 변경

  return (
    <header className="sticky top-0 w-full h-[70px] bg-white z-50">
      <div className="flex items-center justify-between h-full w-full px-[5%]">
        {/* 로고 영역 */}
        <div className="flex items-center ml-4">
          <Link href="/" className="cursor-pointer">
            <Image src={logoPath} alt="로고" width={120} height={40} priority />
          </Link>
        </div>

        {/* 우측 영역 - 로그인 버튼만 표시 */}
        <div className="relative mr-4">
          <button className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors" onClick={() => console.log("로그인 버튼 클릭")}>
            로그인
          </button>
        </div>
      </div>
    </header>
  )
}
