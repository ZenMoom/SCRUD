"use client"

import { forwardRef, useState, useRef, useEffect } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import GitHubRepoBrowser from "../GitHubRepoBrowser"

interface FileWithContent {
  name: string;
  content: string;
}

interface SelectionValue {
  type: string;
  label: string;
}

interface SecurityOption {
  type: string;
  label: string;
}

const securityOptions = [
  { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
  { type: 'SECURITY_DEFAULT_SESSION', label: '세션' },
  { type: 'SECURITY_DEFAULT_NONE', label: '없음' },
];

// 기본값 설정
const DEFAULT_SECURITY_OPTION = securityOptions[0]; // JWT를 기본값으로 설정

interface SecuritySettingFormProps {
  title: string
  value: SelectionValue | FileWithContent[] | SecurityOption
  onChange: (value: SelectionValue | FileWithContent[] | SecurityOption) => void
  onInfoClick: () => void
  onFocus?: () => void
  isRequired?: boolean
}

const SecuritySettingForm = forwardRef<HTMLDivElement, SecuritySettingFormProps>(
  ({ title, value, onChange, onInfoClick, onFocus, isRequired }, ref) => {
    const [inputType, setInputType] = useState<'select' | 'file'>('select')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const [selectedOption, setSelectedOption] = useState<SecurityOption>(
      // value가 있으면 value를 사용하고, 없으면 기본값 사용
      (value as SecurityOption)?.type ? (value as SecurityOption) : DEFAULT_SECURITY_OPTION
    );

    // 컴포넌트가 마운트될 때 기본값 설정
    useEffect(() => {
      if (!value || !(value as SecurityOption)?.type) {
        onChange(DEFAULT_SECURITY_OPTION);
      }
    }, []);

    // value가 변경될 때 selectedOption 업데이트
    useEffect(() => {
      if ((value as SecurityOption)?.type) {
        setSelectedOption(value as SecurityOption);
      }
    }, [value]);

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string, content: string }>) => {
      if (files.length > 0) {
        const githubFiles = files.map(file => ({
          name: file.path,
          content: file.content,
          isGitHub: true
        }));
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

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const content = await file.text();
        const fileWithContent = {
          name: file.name,
          content: content
        };

        console.log('드래그 앤 드롭으로 추가된 파일:');
        console.log('파일명:', fileWithContent.name);
        console.log('파일 내용:', fileWithContent.content);
        
        // 드롭한 파일을 현재 값 배열에 추가
        if (Array.isArray(value)) {
          onChange([...value, fileWithContent]);
        } else {
          // 배열이 아닌 경우 새 배열 생성
          onChange([fileWithContent]);
        }
      }
    }

    const handleFileUpload = () => {
      setDropdownOpen(false)
      // 파일 선택 다이얼로그 트리거
      document.getElementById(`file-upload-${title}`)?.click()
    }

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true); // 인증 로직 없이 바로 모달 열기
    }
    // 입력 타입 변경 핸들러
    const handleInputTypeChange = () => {
      setInputType(inputType === 'select' ? 'file' : 'select');
    };

    const handleOptionChange = (option: SecurityOption) => {
      setSelectedOption(option);
      onChange(option);
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

        {inputType === 'select' ? (
          <div className="space-y-4">
            {securityOptions.map((option) => (
              <div key={option.type} className="flex items-center">
                <input
                  type="radio"
                  id={option.type}
                  name="security"
                  value={option.type}
                  checked={selectedOption.type === option.type}
                  onChange={() => handleOptionChange(option)}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor={option.type} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        ) : (
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
                보안 설정 파일을 드래그해서 추가하거나 <br /> 
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
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const content = await file.text();
                  const fileWithContent = {
                    name: file.name,
                    content: content
                  };

                  console.log('파일 업로드로 추가된 파일:');
                  console.log('파일명:', fileWithContent.name);
                  console.log('파일 내용:', fileWithContent.content);
                  
                  // 현재 value가 배열인 경우 새 파일을 추가
                  if (Array.isArray(value)) {
                    onChange([...value, fileWithContent]);
                  } else {
                    // 배열이 아닌 경우 단일 항목 배열로 설정
                    onChange([fileWithContent]);
                  }
                }
              }}
            />
            
            {/* 선택된 파일 표시 */}
            {Array.isArray(value) && value.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">선택된 파일: {value.length}개</p>
                <div className="flex flex-col space-y-2">
                  {value.map((file, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-gray-500" />
                        <span className="truncate">{file.name}</span>
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
                  ))}
                </div>
              </div>
            )}

            {/* 단일 값인 경우와 호환성 유지 */}
            {!Array.isArray(value) && value && (
              <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                <File size={16} className="text-gray-500" />
                <span>{value.label}</span>
              </div>
            )}
            
            {/* GitHub 레포지토리 브라우저 모달 */}
            <GitHubRepoBrowser 
              isOpen={isGitHubModalOpen} 
              onClose={() => setIsGitHubModalOpen(false)} 
              onSelect={handleGitHubFileSelect}
              formType="securitySetting"
            />
          </div>
        )}
      </div>
    )
  }
)

SecuritySettingForm.displayName = "SecuritySettingForm"

export default SecuritySettingForm 