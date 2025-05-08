"use client"

import { useState } from "react"
import LeftContainer from "./LeftContainer"
import MiddleContainer from "./MiddleContainer"
import RightContainer from "./RightContainer"
import VersionContainer from "./VersionContainer" // 새로 추가할 컴포넌트

export default function EnhancedApiCreator() {
  const [selectedApi, setSelectedApi] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isLeftContainerVisible, setIsLeftContainerVisible] = useState(true)
  const [isVersionContainerVisible, setIsVersionContainerVisible] = useState(false)

  // 선택된 API 변경 핸들러 - 메서드 정보도 함께 받도록 수정
  const handleApiSelect = (apiPath: string, apiMethod: string) => {
    setSelectedApi(apiPath)
    setSelectedMethod(apiMethod)
  }

  // 좌측 컨테이너 토글 핸들러
  const toggleLeftContainer = () => {
    setIsLeftContainerVisible(!isLeftContainerVisible)
  }

  // 버전 컨테이너 토글 핸들러
  const toggleVersionContainer = () => {
    setIsVersionContainerVisible(!isVersionContainerVisible)
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
      <div
        className={`transition-all duration-500 ease-in-out ${
          isLeftContainerVisible && isVersionContainerVisible ? "w-[calc(50%-280px)]" : isLeftContainerVisible || isVersionContainerVisible ? "w-[calc(50%-140px)]" : "w-1/2"
        }`}
      >
        <MiddleContainer onApiSelect={handleApiSelect} />
      </div>

      {/* 우측 컨테이너 */}
      <div
        className={`transition-all duration-500 ease-in-out border-r border-gray-200 ${
          isLeftContainerVisible && isVersionContainerVisible ? "w-[calc(50%-280px)]" : isLeftContainerVisible || isVersionContainerVisible ? "w-[calc(50%-140px)]" : "w-1/2"
        }`}
      >
        <RightContainer selectedApi={selectedApi} selectedMethod={selectedMethod} onToggleVersionPanel={toggleVersionContainer} />
      </div>

      {/* 버전 컨테이너 */}
      <div className={`transition-all duration-500 ease-in-out ${isVersionContainerVisible ? "w-[280px]" : "w-0 overflow-hidden"}`}>
        {isVersionContainerVisible && <VersionContainer selectedApi={selectedApi} />}
      </div>

      {/* 버전 컨테이너 토글 버튼 */}
      <button
        className="bg-white z-10 shadow-sm hover:bg-gray-50 p-1 rounded-full h-8 w-8 flex items-center justify-center self-start mt-4 -ml-4 border border-gray-200"
        onClick={toggleVersionContainer}
      >
        {isVersionContainerVisible ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        )}
      </button>
    </div>
  )
}
