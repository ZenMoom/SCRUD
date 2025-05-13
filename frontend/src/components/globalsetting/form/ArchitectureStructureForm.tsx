"use client"

import { forwardRef, useState, useRef, useEffect } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import { getGitHubAuthUrl } from "@/auth/github"
import GitHubRepoBrowser from "../GitHubRepoBrowser"

interface ArchitectureStructureFormProps {
  title: string
  value: string | string[]
  onChange: (value: string | string[]) => void
  onInfoClick: () => void
  onFocus?: () => void
  isRequired?: boolean
  options?: Array<{ value: string; label: string }>
}

const ArchitectureStructureForm = forwardRef<HTMLDivElement, ArchitectureStructureFormProps>(
  ({ title, value, onChange, onInfoClick, onFocus, isRequired, options }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const [inputType, setInputType] = useState<'file' | 'github' | 'select' | 'default'>('select')
    const [layeredSubType, setLayeredSubType] = useState<'A' | 'B'>('A')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    
    // 컴포넌트 마운트 시 초기값에 따라 레이어드 아키텍처 타입 설정
    useEffect(() => {
      if (value === 'ARCHITECTURE_DEFAULT_LAYERED_A') {
        setLayeredSubType('A');
      } else if (value === 'ARCHITECTURE_DEFAULT_LAYERED_B') {
        setLayeredSubType('B');
      }
    }, [value]);

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path?: string, downloadUrl?: string, content?: string, fileContent?: string, fileType?: string, fileName?: string }>) => {
      if (files.length > 0) {
        const file = files[0]; // 첫 번째 파일/폴더만 사용
        
        // ARCHITECTURE_GITHUB 타입일 경우 특별 처리
        if (file.fileType === 'ARCHITECTURE_GITHUB') {
          // architectureStructure 필드에는 'ARCHITECTURE_GITHUB' 문자열만 설정
          // GitHubRepoBrowser에서 이미 JSON 데이터를 fileContent에 설정했으므로 여기서는 식별자만 전달
          onChange('ARCHITECTURE_GITHUB');
          
          // 디버그용 로그
          console.log('ArchitectureStructureForm - 아키텍처 데이터 선택됨:', {
            path: file.path,
            contentExists: !!file.fileContent,
            fileName: file.fileName
          });
        } else if (file.downloadUrl) {
          // 일반 파일인 경우 - downloadUrl 사용
          onChange(`github:${file.path}|${file.downloadUrl}`);
        } else if (file.path) {
          // 폴더이지만 내용이 없는 경우 (예외 처리)
          onChange(`github:${file.path}|ARCHITECTURE_GITHUB`);
        }
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
        // 파일 드롭 시 파일명 설정
        const fileName = e.dataTransfer.files[0].name;
        onChange(fileName);
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

    // 입력 타입 변경 핸들러
    const handleInputTypeChange = () => {
      setInputType(inputType === 'select' ? 'file' : 'select');
    };

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
          <button
            type="button"
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
            onClick={handleInputTypeChange}
          >
            {inputType === 'select' ? (
              <>
                <Upload size={14} className="mr-1" />
                파일 추가하기
              </>
            ) : (
              <>선택지에서 선택하기</>
            )}
          </button>
        </div>

        <div className="w-full">
          {inputType === 'select' && options && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {options?.map((option) => (
                  <div 
                    key={option.value} 
                    className={`rounded-lg border overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md ${
                      value === option.value || 
                      (option.value === 'ARCHITECTURE_DEFAULT_LAYERED' && 
                        (value === 'ARCHITECTURE_DEFAULT_LAYERED_A' || value === 'ARCHITECTURE_DEFAULT_LAYERED_B'))
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      // 만약 레이어드 아키텍처를 선택했다면 A 타입으로 기본값 설정
                      if (option.value === 'ARCHITECTURE_DEFAULT_LAYERED') {
                        setLayeredSubType('A')
                        // 기본값으로 A 타입 설정하여 전달
                        onChange('ARCHITECTURE_DEFAULT_LAYERED_A')
                      } else {
                        onChange(option.value)
                      }
                      if (onFocus) onFocus()
                    }}
                  >
                    {/* 아키텍처 영역 - 이미지 없이 텍스트만 표시 */}
                    <div className="h-20 bg-white flex items-center justify-center p-2 border-b border-gray-200">
                      <span className="text-gray-700 font-medium text-center">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 레이어드 아키텍처 선택 시 A/B 서브타입 선택 옵션 표시 */}
              {(value === 'ARCHITECTURE_DEFAULT_LAYERED' || 
                value === 'ARCHITECTURE_DEFAULT_LAYERED_A' || 
                value === 'ARCHITECTURE_DEFAULT_LAYERED_B') && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-sm font-medium mb-2">레이어드 아키텍처 타입 선택:</div>
                  <div className="flex flex-col gap-4">
                    <label className={`flex items-start cursor-pointer p-2 rounded-md ${layeredSubType === 'A' ? 'bg-blue-50' : ''}`}>
                      <input
                        type="radio"
                        className="w-4 h-4 text-blue-500 mr-2 mt-1"
                        checked={layeredSubType === 'A'}
                        onChange={() => {
                          setLayeredSubType('A')
                          // 아키텍처 값 변경 시 콜백 호출
                          onChange(`ARCHITECTURE_DEFAULT_LAYERED_A`)
                        }}
                      />
                      <div>
                        <span className="font-medium">타입 A (계층 단위)</span>
                        <p className="text-xs text-gray-500 mt-1">
                          계층별로 폴더를 구성합니다. (controller, service, repository, domain) 각 계층은 별도의 폴더에 있으며 계층 구조가 명확합니다.
                        </p>
                      </div>
                    </label>
                    <label className={`flex items-start cursor-pointer p-2 rounded-md ${layeredSubType === 'B' ? 'bg-blue-50' : ''}`}>
                      <input
                        type="radio"
                        className="w-4 h-4 text-blue-500 mr-2 mt-1"
                        checked={layeredSubType === 'B'}
                        onChange={() => {
                          setLayeredSubType('B')
                          // 아키텍처 값 변경 시 콜백 호출
                          onChange(`ARCHITECTURE_DEFAULT_LAYERED_B`)
                        }}
                      />
                      <div>
                        <span className="font-medium">타입 B (기능 단위)</span>
                        <p className="text-xs text-gray-500 mt-1">
                          기능별로 폴더를 구성합니다. (user, order 등) 각 기능 폴더 내에 관련된 컨트롤러, 서비스, 레포지토리가 함께 존재합니다.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {inputType !== 'select' && (
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
                  아키텍처 구조 파일을 드래그해서 추가하거나 <br /> 
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
                    const fileName = e.target.files[0].name;
                    onChange(fileName);
                  }
                }}
              />
              
              {/* 선택된 파일 표시 (단일 파일) */}
              {!Array.isArray(value) && value && typeof value === 'string' && !value.startsWith('ARCHITECTURE_DEFAULT_') && (
                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                  <File size={16} className="text-gray-500" />
                  <span className="truncate">
                    {/* GitHub JSON 데이터인지 확인하여 다른 메시지 표시 */}
                    {value.startsWith('{') && value.includes('"sha"') && value.includes('"tree"') ? 
                      "GitHub 레포지토리 구조 로드됨" : value}
                  </span>
                </div>
              )}
              
              {/* GitHub API 응답 객체인 경우 특별 표시 */}
              {!Array.isArray(value) && value && typeof value === 'object' && (
                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-blue-100 rounded-lg text-sm text-blue-700">
                  <Github size={16} className="text-blue-500" />
                  <span className="truncate">GitHub 레포지토리 구조 로드됨</span>
                </div>
              )}
              
              {/* GitHub 레포지토리 브라우저 모달 */}
              <GitHubRepoBrowser 
                isOpen={isGitHubModalOpen} 
                onClose={() => setIsGitHubModalOpen(false)} 
                onSelect={handleGitHubFileSelect} 
                isArchitecture={true} 
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)

ArchitectureStructureForm.displayName = "ArchitectureStructureForm"

export default ArchitectureStructureForm 