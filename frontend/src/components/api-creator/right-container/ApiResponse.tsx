import React from "react"
import { ApiResponseData } from "./types"

interface ApiResponseProps {
  apiResponse: ApiResponseData
}

const ApiResponse: React.FC<ApiResponseProps> = ({ apiResponse }) => {
  // 성공 여부 확인 함수
  const isSuccess = (): boolean => {
    return !hasError() && apiResponse.status >= 200 && apiResponse.status < 300
  }

  // 오류 존재 여부를 확인하는 함수
  const hasError = (): boolean => {
    return apiResponse.error !== undefined && apiResponse.error !== null && apiResponse.error !== ""
  }

  // 메시지 아이콘 렌더링
  const renderIcon = () => {
    if (isSuccess()) {
      return (
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )
    } else {
      return (
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
      )
    }
  }

  // 결과 메시지 가져오기
  const getMessage = (): string => {
    if (isSuccess()) {
      return "API Spec 제작 성공!"
    } else {
      return "API Spec 제작 실패"
    }
  }

  // 부가 설명 가져오기
  const getDescription = (): string => {
    if (isSuccess()) {
      return "API 명세가 성공적으로 저장되었습니다."
    } else {
      // 개발 환경에서는 실제 오류 메시지 표시 (선택적)
      return "API 명세 저장 중 오류가 발생했습니다."
    }
  }

  return (
    <div className="border-t p-4 bg-white">
      <div className={`flex items-center p-4 rounded-lg ${isSuccess() ? "bg-green-50" : "bg-red-50"}`}>
        {renderIcon()}
        <div className="ml-4">
          <h3 className={`font-semibold text-lg ${isSuccess() ? "text-green-800" : "text-red-800"}`}>{getMessage()}</h3>
          <p className={`text-sm ${isSuccess() ? "text-green-600" : "text-red-600"} mt-1`}>{getDescription()}</p>
        </div>
      </div>
    </div>
  )
}

export default ApiResponse
