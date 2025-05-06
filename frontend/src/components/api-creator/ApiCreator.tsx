"use client"

import { useState } from "react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./RightContainer"

export default function ApiCreator() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [isLeftContainerVisible, setIsLeftContainerVisible] = useState(true)

  // 선택된 API 변경 핸들러
  const handleApiSelect = (apiPath: string) => {
    setSelectedApi(apiPath)
  }

  // 좌측 컨테이너 토글 핸들러
  const toggleLeftContainer = () => {
    setIsLeftContainerVisible(!isLeftContainerVisible)
  }

  return (
    <div className="flex w-full h-[calc(100vh-140px)] bg-white px-4 py-2">
      {/* 좌측 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out border-r border-gray-200 ${isLeftContainerVisible ? "w-[280px]" : "w-0 overflow-hidden"}`}>
        {isLeftContainerVisible && <LeftContainer />}
      </div>

      {/* 컨테이너 토글 버튼 */}
      <button className="bg-white z-10 shadow-sm hover:bg-gray-50 p-1 rounded-full h-8 w-8 flex items-center justify-center self-start mt-4 -ml-4 border border-gray-200" onClick={toggleLeftContainer}>
        {isLeftContainerVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </button>

      {/* 중앙 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isLeftContainerVisible ? "w-[calc(50%-140px)]" : "w-1/2"}`}>
        <MiddleContainer onApiSelect={handleApiSelect} />
      </div>

      {/* 우측 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isLeftContainerVisible ? "w-[calc(50%-140px)]" : "w-1/2"}`}>
        <RightContainer selectedApi={selectedApi} />
      </div>
    </div>
  )
}
