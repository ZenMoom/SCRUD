"use client"

import { useState, useEffect } from 'react'
import { Github, Upload, File } from 'lucide-react'

interface SecuritySelectorProps {
  value: string
  onChange: (value: string) => void
  onGithubSelect: () => void
  onFileSelect: () => void
}

// 보안 설정 옵션
const securityOptions = [
  { value: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
  { value: 'SECURITY_DEFAULT_SESSION', label: '세션' },
  { value: 'SECURITY_DEFAULT_NONE', label: '없음' }
]

export default function SecuritySelector({ value, onChange, onGithubSelect, onFileSelect }: SecuritySelectorProps) {
  const [inputType, setInputType] = useState<'select' | 'github' | 'file'>('select')

  // 컴포넌트 마운트 시 초기값에 따라 입력 타입 설정
  useEffect(() => {
    if (value) {
      if (value.startsWith('github:')) {
        setInputType('github')
      } else if (value.startsWith('SECURITY_DEFAULT_')) {
        setInputType('select')
      } else {
        setInputType('file')
      }
    }
  }, [value])

  return (
    <div className="space-y-4">
      {/* 입력 방식 선택 */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setInputType('select')}
          className={`flex-1 py-2 px-4 rounded-md border ${
            inputType === 'select' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-gray-300'
          }`}
        >
          선택지에서 선택
        </button>
        <button
          type="button"
          onClick={() => {
            setInputType('github')
            onGithubSelect()
          }}
          className={`flex-1 py-2 px-4 rounded-md border flex items-center justify-center gap-2 ${
            inputType === 'github' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-gray-300'
          }`}
        >
          <Github size={16} />
          <span>GitHub</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setInputType('file')
            onFileSelect()
          }}
          className={`flex-1 py-2 px-4 rounded-md border flex items-center justify-center gap-2 ${
            inputType === 'file' ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-gray-300'
          }`}
        >
          <Upload size={16} />
          <span>파일</span>
        </button>
      </div>

      {/* 선택지 */}
      {inputType === 'select' && (
        <div className="space-y-2">
          {securityOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="security-option"
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="w-4 h-4 text-blue-500"
              />
              <span className="ml-3">{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* GitHub 선택 UI */}
      {inputType === 'github' && value.startsWith('github:') && (
        <div className="p-3 rounded-lg border border-gray-200 flex items-center">
          <File size={16} className="text-gray-500 mr-2" />
          <span className="text-gray-700">{value.substring(7)}</span>
        </div>
      )}

      {/* 파일 선택 UI */}
      {inputType === 'file' && !value.startsWith('github:') && !value.startsWith('SECURITY_DEFAULT_') && value && (
        <div className="p-3 rounded-lg border border-gray-200 flex items-center">
          <File size={16} className="text-gray-500 mr-2" />
          <span className="text-gray-700">{value}</span>
        </div>
      )}
    </div>
  )
} 