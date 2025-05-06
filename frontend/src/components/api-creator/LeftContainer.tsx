"use client"

import { useState } from "react"

interface MenuItem {
  id: number
  name: string
  subItems?: string[]
}

export default function LeftContainer() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  const menuItems: MenuItem[] = [
    { id: 1, name: "프로젝트명", subItems: ["프로젝트 이름 설정", "프로젝트 ID 설정"] },
    { id: 2, name: "프로젝트 설명", subItems: ["상세 설명", "목적", "범위"] },
    { id: 3, name: "Server URL", subItems: ["개발 서버", "운영 서버"] },
    { id: 4, name: "요구사항 명세서", subItems: ["기능 요구사항", "비기능 요구사항"] },
    { id: 5, name: "ERD", subItems: ["엔티티 정의", "관계 설정"] },
    { id: 6, name: "의존성 파일", subItems: ["라이브러리", "프레임워크"] },
    { id: 7, name: "유틸 클래스", subItems: ["공통 유틸", "헬퍼 함수"] },
    { id: 8, name: "에러 코드", subItems: ["에러 타입", "에러 메시지"] },
    { id: 9, name: "보안 설정", subItems: ["인증", "인가", "암호화"] },
    { id: 10, name: "코드 컨벤션", subItems: ["네이밍", "스타일", "문서화"] },
    { id: 11, name: "아키텍처 구조", subItems: ["계층 구조", "컴포넌트 관계"] },
  ]

  // 아코디언 토글 핸들러
  const toggleAccordion = (id: number) => {
    if (expandedItem === id) {
      setExpandedItem(null)
    } else {
      setExpandedItem(id)
    }
  }

  return (
    <div className="bg-white h-full w-full">
      <div className="py-4 px-3">
        <h2 className="text-lg font-bold text-gray-800">프로젝트 설정</h2>
      </div>
      <div className="overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <ul className="divide-y divide-gray-200">
          {menuItems.map((item) => (
            <li key={item.id} className="border-gray-100">
              <button className="flex items-center justify-between w-full py-3 px-3 text-left font-medium text-gray-700 hover:text-gray-900 transition-colors" onClick={() => toggleAccordion(item.id)}>
                <span>{item.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-300 text-gray-400 ${expandedItem === item.id ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* 아코디언 콘텐츠 */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedItem === item.id ? "max-h-40 opacity-100 pb-2" : "max-h-0 opacity-0"}`}>
                <ul className="pl-4 space-y-1">
                  {item.subItems?.map((subItem, index) => (
                    <li key={index} className="text-sm text-gray-600 hover:text-blue-500 transition-colors cursor-pointer py-1 px-3">
                      {subItem}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
