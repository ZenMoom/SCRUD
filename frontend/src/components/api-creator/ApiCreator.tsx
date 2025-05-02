// components/api-creator/ApiCreator.tsx
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
    <div className="flex gap-4 transition-all duration-500 ease-in-out">
      {/* 좌측 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isLeftContainerVisible ? "w-1/4" : "w-0 overflow-hidden"}`}>{isLeftContainerVisible && <LeftContainer />}</div>

      {/* 컨테이너 토글 버튼 */}
      <button className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full h-10 w-10 flex items-center justify-center self-start mt-4" onClick={toggleLeftContainer}>
        {isLeftContainerVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        )}
      </button>

      {/* 중앙 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isLeftContainerVisible ? "w-1/3" : "w-1/2"}`}>
        <MiddleContainer onApiSelect={handleApiSelect} />
      </div>

      {/* 우측 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isLeftContainerVisible ? "w-1/3" : "w-1/2"}`}>
        <RightContainer selectedApi={selectedApi} />
      </div>
    </div>
  )
}
