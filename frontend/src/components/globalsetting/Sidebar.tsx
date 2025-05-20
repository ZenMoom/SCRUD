"use client"

import { XCircle } from 'lucide-react';

interface SidebarProps {
  activeItem: string
  onItemClick: (item: string) => void
  isMobile?: boolean
  toggleSidebar?: () => void
}

export default function Sidebar({ activeItem, onItemClick, isMobile, toggleSidebar }: SidebarProps) {
  const items = [
    { id: "title", label: "프로젝트명", required: true },
    { id: "description", label: "프로젝트 설명", required: true },
    { id: "serverUrl", label: "Server URL", required: true },
    { id: "requirementSpec", label: "요구사항 명세서", required: true },
    { id: "erd", label: "ERD", required: true },
    { id: "dependencyFile", label: "의존성 파일", required: false },
    { id: "utilityClass", label: "유틸 클래스", required: false },
    { id: "errorCode", label: "에러 코드", required: false },
    { id: "securitySetting", label: "보안 설정", required: false },
    { id: "codeConvention", label: "코드 컨벤션", required: false },
    { id: "architectureStructure", label: "아키텍처 구조", required: false },
  ]

  return (
    <div className="w-[300px] h-full bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out md:block hidden">
      {isMobile && (
        <button 
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 md:hidden"
          onClick={toggleSidebar}
        >
          <XCircle size={20} />
        </button>
      )}
      
      
      <div className="overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ height: "calc(100vh - 105px)" }}>
      <ul className="px-2 py-2 flex flex-col justify-between h-full">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center py-4 px-4 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100 
              ${activeItem === item.id ? 'bg-gray-100 font-medium' : ''}`}
              onClick={() => onItemClick(item.id)}
            >
              <span className="text-base flex items-center gap-1">
                {item.label}
                {item.required && <span className="text-red-500">*</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
