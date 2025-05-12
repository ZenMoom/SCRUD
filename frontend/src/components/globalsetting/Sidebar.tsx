"use client"

import { CheckCircle, XCircle } from 'lucide-react';

interface SidebarProps {
  completed: Record<string, boolean>
  activeItem: string
  onItemClick: (item: string) => void
  isMobile?: boolean
  toggleSidebar?: () => void
}

export default function Sidebar({ completed, activeItem, onItemClick, isMobile, toggleSidebar }: SidebarProps) {
  const items = [
    { id: "title", label: "프로젝트명" },
    { id: "description", label: "프로젝트 설명" },
    { id: "serverUrl", label: "Server URL" },
    { id: "requirementSpec", label: "요구사항 명세서" },
    { id: "erd", label: "ERD" },
    { id: "dependencyFile", label: "의존성 파일" },
    { id: "utilityClass", label: "유틸 클래스" },
    { id: "errorCode", label: "에러 코드" },
    { id: "securitySetting", label: "보안 설정" },
    { id: "codeConvention", label: "코드 컨벤션" },
    { id: "architectureStructure", label: "아키텍처 구조" },
  ]

  return (
    <div className={`min-w-[300px] w-[300px] h-[90vh] bg-white p-6 overflow-y-auto shadow-md transition-all duration-300 ease-in-out md:block hidden`}>
      {isMobile && (
        <button 
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 md:hidden"
          onClick={toggleSidebar}
        >
          <XCircle size={20} />
        </button>
      )}
      
      <ul className="list-none p-0 m-0">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center py-3 px-4 mb-1 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100 
            ${activeItem === item.id ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => onItemClick(item.id)}
          >
            {completed[item.id] ? (
              <CheckCircle className="text-green-500 mr-2.5" size={20} />
            ) : (
              <XCircle className="text-red-500 mr-2.5" size={20} />
            )}
            <span className="text-base">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
