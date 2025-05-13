"use client"

import { forwardRef, useState, useRef } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import { getGitHubAuthUrl } from "@/auth/github"
import GitHubRepoBrowser from "../GitHubRepoBrowser"

// 파일 객체 타입 정의
interface FileWithContent {
  name: string;
  content: string;
}

// 문자열 또는 파일 객체 타입
type FileValue = string | FileWithContent;

interface RequirementSpecFormProps {
  title: string
  value: FileValue | FileValue[]
  onChange: (value: FileValue | FileValue[]) => void
  onInfoClick: () => void
  onFocus?: () => void
  isRequired?: boolean
}

const RequirementSpecForm = forwardRef<HTMLDivElement, RequirementSpecFormProps>(
  ({ title, value, onChange, onInfoClick, onFocus, isRequired }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    
    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string, downloadUrl?: string }>) => {
      if (files.length > 0) {
        // 모든 선택된 파일 처리
        const githubFiles = files.map(file => {
          // fileUrl이 있으면 fileUrl 포함, 없으면 기존 방식대로 처리
          if (file.downloadUrl) {
            // 파일 경로와 URL을 모두 포함해서 저장 (파이프로 구분)
            return `github:${file.path}|${file.downloadUrl}`;
          } else {
            // 기존 방식 (URL 없는 경우)
            return `github:${file.path}`;
          }
        });

        // 배열을 결과로 반환
        onChange(githubFiles);
      }
      setIsGitHubModalOpen(false);
    };

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
        const file = e.dataTransfer.files[0];
        const fileName = file.name;
        
        // 파일 내용 읽기
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const fileContent = event.target.result as string;
            
            // 새로운 파일 객체 생성
            const fileWithContent: FileWithContent = { 
              name: fileName, 
              content: fileContent 
            };
            
            // 드롭한 파일을 현재 값 배열에 추가
            if (Array.isArray(value)) {
              onChange([...value, fileWithContent]);
            } else {
              // 배열이 아닌 경우 새 배열 생성
              onChange([fileWithContent]);
            }
          }
        };
        
        // 텍스트 파일로 읽기
        reader.readAsText(file);
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
            const oauthUrl = getGitHubAuthUrl(`${apiUrl}/globalsetting`);
            window.location.href = oauthUrl;
          }
        } else {
          // 토큰이 없는 경우 바로 인증 요청
          console.log('GitHub 토큰 없음, 인증 요청');
          const oauthUrl = getGitHubAuthUrl(`${apiUrl}/globalsetting`);
          window.location.href = oauthUrl;
        }
      } catch (error) {
        console.error('GitHub 토큰 검증 중 오류 발생:', error);
        setIsGitHubModalOpen(true);
        // 오류 발생시 토큰 삭제 후 재인증
        localStorage.removeItem('github-token-direct');
        // 레포지토리 불러오기는 모달 내부에서 처리하며, 실패 시 바로 재인증 요청
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

        <div className="w-full">
          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
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
            <Upload size={24} className="text-gray-400 mb-2" />
            <p className="text-gray-500 text-center text-sm">
              {title} 파일을 드래그해서 추가하거나 <br /> 
              <span className="text-blue-500">
                업로드하세요
              </span>
            </p>
          </div>
          
          {/* 드롭다운 메뉴 */}
          {dropdownOpen && (
            <div ref={dropdownRef} className="relative">
              <div className="absolute top-2 left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button 
                  type="button" 
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 first:rounded-t-lg" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGithubUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Github size={16} className="text-gray-500" />
                  <span>GitHub에서 가져오기</span>
                </button>
                <button 
                  type="button" 
                  className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 last:rounded-b-lg" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Upload size={16} className="text-gray-500" />
                  <span>파일 업로드</span>
                </button>
              </div>
            </div>
          )}

          <input
            id={`file-upload-${title}`}
            type="file"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const fileName = file.name;
                
                // 파일 내용 읽기
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target && event.target.result) {
                    const fileContent = event.target.result as string;
                    
                    // 새로운 파일 객체 생성
                    const fileWithContent: FileWithContent = { 
                      name: fileName, 
                      content: fileContent 
                    };
                    
                    // 파일을 현재 값 배열에 추가
                    if (Array.isArray(value)) {
                      onChange([...value, fileWithContent]);
                    } else {
                      // 배열이 아닌 경우 단일 항목 배열로 설정
                      onChange([fileWithContent]);
                    }
                  }
                };
                
                // 텍스트 파일로 읽기
                reader.readAsText(file);
              }
            }}
          />
          
          {/* 선택된 파일 표시 */}
          {Array.isArray(value) && value.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">선택된 파일: {value.length}개</p>
              <div className="flex flex-col space-y-2">
                {value.map((file, index) => {
                  // 파일 이름 표시 로직
                  const displayName = typeof file === 'string' 
                    ? file.startsWith('github:') 
                      ? file.substring(7).split('|')[0] // GitHub 경로만 추출하여 표시
                      : file 
                    : (file as FileWithContent).name;
                    
                  return (
                    <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-gray-500" />
                        <span className="truncate">{displayName}</span>
                      </div>
                      <button
                        onClick={() => {
                          const newFiles = [...value];
                          newFiles.splice(index, 1);
                          onChange(newFiles);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 단일 값인 경우와 호환성 유지 */}
          {!Array.isArray(value) && value && (
            <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
              <File size={16} className="text-gray-500" />
              <span>
                {typeof value === 'string' 
                  ? value.startsWith('github:')
                    ? value.substring(7).split('|')[0] // GitHub 경로만 추출하여 표시
                    : value 
                  : (value as FileWithContent).name}
              </span>
            </div>
          )}
          
          {/* GitHub 레포지토리 브라우저 모달 */}
          <GitHubRepoBrowser 
            isOpen={isGitHubModalOpen} 
            onClose={() => setIsGitHubModalOpen(false)} 
            onSelect={handleGitHubFileSelect} 
            isArchitecture={false}
          />
        </div>
      </div>
    )
  }
)

RequirementSpecForm.displayName = "RequirementSpecForm"

export default RequirementSpecForm 