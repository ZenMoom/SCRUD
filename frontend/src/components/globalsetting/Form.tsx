"use client"

import { forwardRef, useEffect, useState } from "react"
import { HelpCircle } from "lucide-react"
import { useProjectTempStore } from "@/store/projectTempStore"

interface FormItemProps {
  title: string
  type: 'text' | 'textarea'
  value: string
  onChange: (value: string) => void
  onInfoClick: () => void
  onFocus?: () => void
  isRequired?: boolean
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(({ title, type, value, onChange, onInfoClick, onFocus, isRequired }, ref) => {
  const { tempData, setTempData } = useProjectTempStore()
  const [urlError, setUrlError] = useState<string>('')

  // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isFromGithubAuth = params.get('from') === 'github-auth'

    if (isFromGithubAuth) {
      console.log('기본 정보 임시저장 데이터:', {
        title: tempData.title,
        description: tempData.description,
        serverUrl: tempData.serverUrl
      })

      // 각 필드에 해당하는 임시저장 데이터가 있으면 복원
      if (title === '프로젝트명' && tempData.title) {
        onChange(tempData.title)
      } else if (title === '프로젝트 설명' && tempData.description) {
        onChange(tempData.description)
      } else if (title === 'Server URL' && tempData.serverUrl) {
        onChange(tempData.serverUrl)
      }
    }
  }, [])

  // 값이 변경될 때마다 임시저장
  const handleChange = (newValue: string) => {
    onChange(newValue)
    
    // 각 필드에 맞는 키로 저장
    if (title === '프로젝트명') {
      setTempData({ title: newValue })
    } else if (title === '프로젝트 설명') {
      setTempData({ description: newValue })
    } else if (title === 'Server URL') {
      setTempData({ serverUrl: newValue })
    }
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      setUrlError('')
      return true
    } catch {
      setUrlError('정확한 url을 입력해 주세요.')
      return false
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    handleChange(newValue)
    if (newValue) {
      validateUrl(newValue)
    } else {
      setUrlError('')
    }
  }

  // 렌더링할 컴포넌트 선택
  const renderInputComponent = () => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            value={value as string}
            onChange={handleUrlChange}
            className={`w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              urlError ? 'border-red-300' : ''
            }`}
            placeholder={`${title} 입력`}
            onFocus={onFocus}
          />
        )
      case "textarea":
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            placeholder={`${title} 입력`}
            onFocus={onFocus}
          />
        )
      default:
        return null
    }
  }

  return (
    <div ref={ref} className="mb-10 p-10 bg-white rounded-lg">
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold m-0">{title} {isRequired && <span className="text-red-500">*</span>}</h2>
          <button
            type="button"
            className="bg-transparent border-none text-gray-400 cursor-pointer ml-2 p-0 flex items-center justify-center transition-colors duration-200 hover:text-gray-600"
            onClick={onInfoClick}
            aria-label={`${title} 정보`}
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
      {renderInputComponent()}
      {urlError && (
        <p className="mt-1 text-sm text-red-600">{urlError}</p>
      )}
    </div>
  )
})

FormItem.displayName = "FormItem"

export default FormItem