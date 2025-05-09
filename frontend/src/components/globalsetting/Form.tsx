"use client"

import { forwardRef, useState, useEffect, useRef } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import { getGitHubAuthUrl } from "@/auth/github"
import GitHubRepoBrowser from "./GitHubRepoBrowser"

interface FormItemProps {
  title: string
  type: string
  value: string
  onChange: (value: string) => void
  onInfoClick: () => void
  options?: Array<{ value: string; label: string }>
  onFocus?: () => void
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(({ title, type, value, onChange, onInfoClick, options, onFocus }, ref) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && dropdownRef.current && buttonRef.current && !dropdownRef.current.contains(event.target as Node) && !buttonRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0].name)
    }
  }

  const handleFileUpload = () => {
    setDropdownOpen(false)
    // 파일 선택 다이얼로그 트리거
    document.getElementById(`file-upload-${title}`)?.click()
  }

  const handleGithubUpload = async () => {
    setDropdownOpen(false);
    
    // 1. 깃허브 토큰 확인
    const githubToken = localStorage.getItem('github-token-direct');
    
    try {
      if (githubToken) {
        // 토큰이 있는 경우, 유효성 검사를 위해 GitHub API 호출
        console.log('GitHub 토큰 유효성 확인 중...');
        
        // 간단한 API 호출로 토큰 유효성 확인 - 사용자 레포지토리 목록 요청
        const response = await fetch('/api/github/user/repos', {
          headers: {
            'Authorization': `Bearer ${githubToken}`
          }
        });
        
        if (response.ok) {
          // 토큰이 유효한 경우 모달 열기
          console.log('GitHub 토큰 유효함, 모달 열기');
          setIsGitHubModalOpen(true);
        } else {
          // 토큰이 유효하지 않은 경우 (401 등)
          console.error('GitHub 토큰이 유효하지 않음, 재인증 요청');
          
          // 토큰 삭제
          localStorage.removeItem('github-token-direct');
          
          // 인증 요청
          const redirectUri = 'http://localhost:3000/globalsetting';
          const oauthUrl = getGitHubAuthUrl(redirectUri);
          window.location.href = oauthUrl;
        }
      } else {
        // 토큰이 없는 경우 바로 인증 요청
        console.log('GitHub 토큰 없음, 인증 요청');
        const redirectUri = 'http://localhost:3000/globalsetting';
        const oauthUrl = getGitHubAuthUrl(redirectUri);
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error('GitHub 토큰 검증 중 오류 발생:', error);
      
      // 오류 발생시 토큰 삭제 후 재인증
      localStorage.removeItem('github-token-direct');
      const redirectUri = 'http://localhost:3000/globalsetting';
      const oauthUrl = getGitHubAuthUrl(redirectUri);
      window.location.href = oauthUrl;
    }
  }

  // GitHub 파일 선택 처리
  const handleGitHubFileSelect = (files: { path: string; content: string }[]) => {
    if (files.length > 0) {
      // 첫 번째 파일 이름만 사용
      onChange(files[0].path);
    }
  };

  const renderInput = () => {
    switch (type) {
      case "text":
        return (
          <input
            type="text"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-gray-500 focus:shadow-sm"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            placeholder={`${title}을(를) 입력하세요`}
            onFocus={onFocus}
          />
        )
      case "textarea":
        return (
          <textarea
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-gray-50 focus:outline-none focus:border-gray-500 focus:shadow-sm resize-none"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            placeholder={`${title}을(를) 입력하세요`}
            rows={4}
            onFocus={onFocus}
          />
        )
      case "file":
        return (
          <div className="w-full">
            <div
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
              } rounded-lg cursor-pointer relative transition-all duration-200 hover:border-blue-500 hover:bg-gray-100`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                setDropdownOpen(!dropdownOpen)
                if (onFocus) onFocus()
              }}
              ref={buttonRef}
            >
              <div className="flex flex-col items-center justify-center w-full">
                <Upload size={24} className="text-gray-500 mb-2" />
                <span className="text-sm text-gray-500 my-2">파일을 추가하세요. (CSV, HTML, TXT 등)</span>
              </div>

              {dropdownOpen && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] z-10" ref={dropdownRef}>
                  <button type="button" className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 first:rounded-t-lg" onClick={handleGithubUpload}>
                    <Github size={16} className="text-gray-500" />
                    <span>GitHub에서 가져오기</span>
                  </button>
                  <button type="button" className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 last:rounded-b-lg" onClick={handleFileUpload}>
                    <File size={16} className="text-gray-500" />
                    <span>파일 업로드</span>
                  </button>
                </div>
              )}

              <input
                id={`file-upload-${title}`}
                type="file"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    onChange(e.target.files[0].name)
                  }
                }}
              />
            </div>
            {value && (
              <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                <File size={16} className="text-gray-500" />
                <span>{value}</span>
              </div>
            )}
            
            {/* GitHub 레포지토리 브라우저 모달 */}
            <GitHubRepoBrowser 
              isOpen={isGitHubModalOpen} 
              onClose={() => setIsGitHubModalOpen(false)} 
              onSelect={handleGitHubFileSelect} 
            />
          </div>
        )
      case "radio":
        return (
          <div className="flex flex-col gap-3">
            {options?.map((option) => (
              <label key={option.value} className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-150">
                <input
                  type="radio"
                  name={title}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => {
                    onChange(option.value)
                    if (onFocus) onFocus()
                  }}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="ml-3 text-base">{option.label}</span>
              </label>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div ref={ref} className="mb-10 p-10 bg-white rounded-lg">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold m-0">{title}</h2>
        <button
          type="button"
          className="bg-transparent border-none text-gray-400 cursor-pointer ml-2 p-0 flex items-center justify-center transition-colors duration-200 hover:text-gray-600"
          onClick={onInfoClick}
          aria-label={`${title} 정보`}
        >
          <HelpCircle size={20} />
        </button>
      </div>
      {renderInput()}
    </div>
  )
})

FormItem.displayName = "FormItem"

export default FormItem