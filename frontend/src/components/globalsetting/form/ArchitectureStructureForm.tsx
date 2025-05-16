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

interface ArchitectureOption {
  type: string;
  label: string;
  imageUrl: string;
}

const architectureOptions = [
    { type: 'ARCHITECTURE_DEFAULT_LAYERED', label: '레이어드 아키텍처(A/B)', imageUrl: '/layered-a.png' },
  { type: 'ARCHITECTURE_DEFAULT_CLEAN', label: '클린 아키텍처', imageUrl: '/clean.png' },
  { type: 'ARCHITECTURE_DEFAULT_MSA', label: '마이크로서비스 아키텍처', imageUrl: '/msa.png' },
  { type: 'ARCHITECTURE_DEFAULT_HEX', label: '헥사고날 아키텍처', imageUrl: '/hex.png' },
];

const layeredOptions = [
  { type: 'ARCHITECTURE_DEFAULT_LAYERED_A', label: '레이어드 아키텍처 A', imageUrl: '/layered-a.png' },
  { type: 'ARCHITECTURE_DEFAULT_LAYERED_B', label: '레이어드 아키텍처 B', imageUrl: '/layered-b.png' },
];

// 기본값 설정
const DEFAULT_ARCHITECTURE_OPTION = architectureOptions[0];

interface ArchitectureStructureFormProps {
  title: string
  value: SelectionValue | FileWithContent[] | ArchitectureOption
  onChange: (value: SelectionValue | FileWithContent[] | ArchitectureOption) => void
  onInfoClick: () => void
  onFocus?: () => void
  isRequired?: boolean
}

const ArchitectureStructureForm = forwardRef<HTMLDivElement, ArchitectureStructureFormProps>(
  ({ title, value, onChange, onInfoClick, onFocus, isRequired }, ref) => {
    const [inputType, setInputType] = useState<'select' | 'file'>('select')
    const [showLayeredOptions, setShowLayeredOptions] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const [selectedOption, setSelectedOption] = useState<ArchitectureOption>(
      // value가 있으면 value를 사용하고, 없으면 기본값 사용
      (value as ArchitectureOption)?.type ? (value as ArchitectureOption) : DEFAULT_ARCHITECTURE_OPTION
    );

    // 컴포넌트가 마운트될 때 기본값 설정
    useEffect(() => {
      if (!value || !(value as ArchitectureOption)?.type) {
        onChange(DEFAULT_ARCHITECTURE_OPTION);
      }
    }, []);

    // value가 변경될 때 selectedOption 업데이트
    useEffect(() => {
      if ((value as ArchitectureOption)?.type) {
        setSelectedOption(value as ArchitectureOption);
      }
    }, [value]);

     const handleOptionChange = (option: ArchitectureOption) => {
      if (option.type === 'ARCHITECTURE_DEFAULT_LAYERED') {
        setShowLayeredOptions(true);
        setSelectedOption(option);
      } else {
        setShowLayeredOptions(false);
        setSelectedOption(option);
        onChange(option);
      }
    };

    const handleLayeredOptionChange = (option: ArchitectureOption) => {
      setSelectedOption(option);
      onChange(option);
    };

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Record<string, unknown>[]) => {
      if (files.length > 0) {
        console.log('=== ArchitectureStructureForm handleGitHubFileSelect ===');
        console.log('변환 전 GitHub 데이터:', files);
        
        const convertedFiles = files.map(file => ({
          name: file.path as string || 'unnamed_file',
          content: JSON.stringify(file.content),  // 객체를 문자열로 변환
          isGitHub: true
        }));
        
        console.log('변환 후 데이터:', convertedFiles);
        onChange(convertedFiles);
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
      const newInputType = inputType === 'select' ? 'file' : 'select';
      setInputType(newInputType);
      
      // 입력 타입이 변경될 때 이전 선택값 초기화
      if (newInputType === 'file') {
        // 파일 모드로 변경 시 빈 배열로 초기화
        onChange([] as FileWithContent[]);
      } else {
        // 선택 모드로 변경 시 기본값으로 초기화
        onChange({ type: "ARCHITECTURE_DEFAULT_LAYERED_A", label: "ARCHITECTURE_DEFAULT_LAYERED_A" });
      }
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
          <div className="space-y-6">
            {/* 기본 아키텍처 옵션들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {architectureOptions.map((option) => (
                <div 
                  key={option.type} 
                  className={`cursor-pointer p-4 rounded-lg transition-all h-full flex flex-col ${
                    selectedOption.type === option.type || (showLayeredOptions && option.type === 'ARCHITECTURE_DEFAULT_LAYERED')
                      ? 'border-2 border-blue-500'
                      : 'border border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleOptionChange(option)}
                >
                  <div className="text-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <img 
                      src={option.imageUrl} 
                      alt={option.label} 
                      className="w-full h-auto max-h-[200px] object-contain rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 레이어드 상세 옵션 */}
            {showLayeredOptions && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">레이어드 아키텍처 상세 옵션</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layeredOptions.map((option) => (
                    <div 
                      key={option.type} 
                      className={`cursor-pointer p-4 rounded-lg transition-all h-full flex flex-col ${
                        selectedOption.type === option.type 
                          ? 'border-2 border-blue-500'
                          : 'border border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleLayeredOptionChange(option)}
                    >
                      <div className="text-center mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {option.label}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <img 
                          src={option.imageUrl} 
                          alt={option.label} 
                          className="w-full h-auto max-h-[200px] object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              formType="architectureStructure"
              isArchitecture={true}
            />
          </div>
        )}
      </div>
    )
  }
)

ArchitectureStructureForm.displayName = "ArchitectureStructureForm"

export default ArchitectureStructureForm 