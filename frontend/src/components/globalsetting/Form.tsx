"use client"

import { forwardRef } from "react"
import { HelpCircle } from "lucide-react"

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
  // 렌더링할 컴포넌트 선택
  const renderInputComponent = () => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`${title}을 입력하세요`}
            onFocus={onFocus}
          />
        )
      case "textarea":
        return (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            placeholder={`${title}을 입력하세요`}
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
    </div>
  )
})

FormItem.displayName = "FormItem"

export default FormItem