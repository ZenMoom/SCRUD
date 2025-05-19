"use client"

import { forwardRef, useState, useRef, useEffect } from "react"
import { Upload, Github, File } from "lucide-react"
import GitHubRepoBrowser from "../GitHubRepoBrowser"
import { useProjectTempStore } from "@/store/projectTempStore"
import { ArchitectureOption } from "@/store/types/project"

interface FileWithContent {
  name: string;
  content: string;
  isGitHub?: boolean;
  repoName?: string;
}

const architectureOptions = [
    { type: 'ARCHITECTURE_DEFAULT_LAYERED', label: '레이어드 아키텍처(A/B)', imageUrl: '/layered-a.png' },
  { type: 'ARCHITECTURE_DEFAULT_CLEAN', label: '클린 아키텍처', imageUrl: '/clean.png' },
  { type: 'ARCHITECTURE_DEFAULT_MSA', label: '마이크로서비스 아키텍처', imageUrl: '/msa.png' },
  { type: 'ARCHITECTURE_DEFAULT_HEX', label: '헥사고날 아키텍처', imageUrl: '/hex.png' },
];

const layeredOptions = [
  { type: 'ARCHITECTURE_DEFAULT_LAYERED_A', label: '레이어드 아키텍처 A - 도메인 중심 구조', imageUrl: '/layered-a.png' },
  { type: 'ARCHITECTURE_DEFAULT_LAYERED_B', label: '레이어드 아키텍처 B - 계층 중심 구조', imageUrl: '/layered-b.png' },
];

// 기본값 설정
const DEFAULT_ARCHITECTURE_OPTION = layeredOptions[0];

interface ArchitectureStructureFormProps {
  title: string;
  onChange: (value: ArchitectureOption | FileWithContent[]) => void;
  onInfoClick: () => void;
  onFocus?: () => void;
  isRequired?: boolean;
}

const ArchitectureStructureForm = forwardRef<HTMLDivElement, ArchitectureStructureFormProps>(
  ({ title, onChange, onInfoClick, onFocus, isRequired }, ref) => {
    const [inputType, setInputType] = useState<'select' | 'file'>('select')
    const [showLayeredOptions, setShowLayeredOptions] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const [selectedFiles, setSelectedFiles] = useState<FileWithContent[]>([])
    const [selectedOption, setSelectedOption] = useState<ArchitectureOption>(DEFAULT_ARCHITECTURE_OPTION)
    const [githubFiles, setGithubFiles] = useState<FileWithContent[] | null>(null)
    const [repoName, setRepoName] = useState<string | null>(null)

    const { tempData, setTempData } = useProjectTempStore()

    // 외부 클릭 감지를 위한 이벤트 리스너
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownOpen &&
            dropdownRef.current &&
            buttonRef.current &&
            !dropdownRef.current.contains(event.target as Node) &&
            !buttonRef.current.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [dropdownOpen]);

    // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      const isFromGithubAuth = params.get('from') === 'github-auth'
      const isAuthPending = localStorage.getItem('github-auth-pending') === 'true'

      if (isFromGithubAuth && isAuthPending && tempData.architectureStructure) {
        if (tempData.architectureStructure.type === 'selection' && tempData.architectureStructure.selection) {
          setInputType('select')
          setSelectedOption(tempData.architectureStructure.selection)
          onChange(tempData.architectureStructure.selection)
        } else if (tempData.architectureStructure.type === 'file' && tempData.architectureStructure.files) {
          setInputType('file')
          const files = tempData.architectureStructure.files.map(file => ({
            name: file.name || '',
            content: typeof file.content === 'string' ? file.content : JSON.stringify(file.content)
          }))
          setSelectedFiles(files)
          onChange(files)
        }
      }
    }, [])

    const handleOptionChange = (option: ArchitectureOption) => {
      if (option.type === 'ARCHITECTURE_DEFAULT_LAYERED') {
        setShowLayeredOptions(true)
        setSelectedOption(option)
      } else {
        setShowLayeredOptions(false)
        setSelectedOption(option)
        setGithubFiles(null)
        setRepoName(null)
        onChange(option)
        setTempData({
          architectureStructure: {
            type: 'selection',
            selection: option
          }
        })
      }
    }

    const handleLayeredOptionChange = (option: ArchitectureOption) => {
      setSelectedOption(option)
      setGithubFiles(null)
      setRepoName(null)
      onChange(option)
      setTempData({
        architectureStructure: {
          type: 'selection',
          selection: option
        }
      })
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        const content = await file.text()
        const fileWithContent = {
          name: file.name,
          content: content
        }

        const updatedFiles = [fileWithContent]
        setSelectedFiles(updatedFiles)
        onChange(updatedFiles)
        setTempData({
          architectureStructure: {
            type: 'file',
            files: updatedFiles.map(file => ({
              name: file.name,
              content: file.content
            }))
          }
        })
      }
    }

    const handleFileUploadClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDropdownOpen(false);
      document.getElementById(`file-upload-${title}`)?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const content = await file.text();
        const fileWithContent = {
          name: file.name,
          content: content
        };
        const updatedFiles = [fileWithContent];
        console.log('[ArchForm] handleFileChange: updatedFiles', updatedFiles);
        setSelectedFiles(updatedFiles);
        onChange(updatedFiles);
        setTempData({
          architectureStructure: {
            type: 'file',
            files: updatedFiles.map(file => ({
              name: file.name,
              content: file.content
            }))
          }
        });
      }
    };

    // 입력 타입 변경 핸들러
    const handleInputTypeChange = () => {
      console.log('[ArchForm] handleInputTypeChange: inputType ->', inputType === 'select' ? 'file' : 'select');
      const newInputType = inputType === 'select' ? 'file' : 'select'
      setInputType(newInputType)
      
      if (newInputType === 'file') {
        // 파일 모드로 변경
        setSelectedFiles([])
        onChange([])
        setTempData({
          architectureStructure: {
            type: 'file',
            files: []
          }
        })
      } else {
        // 선택 모드로 변경
        setSelectedOption(DEFAULT_ARCHITECTURE_OPTION)
        onChange(DEFAULT_ARCHITECTURE_OPTION)
        setTempData({
          architectureStructure: {
            type: 'selection',
            selection: DEFAULT_ARCHITECTURE_OPTION
          }
        })
      }
    }

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Record<string, unknown>[]) => {
      if (files.length > 0) {
        // repoName 추출 (repoInfo.name > path에서 마지막 / 뒤 값)
        let repoName = undefined;
        if (files[0].repoInfo && typeof files[0].repoInfo.name === 'string') {
          repoName = files[0].repoInfo.name;
        } else if (files[0].path && typeof files[0].path === 'string') {
          const match = files[0].path.match(/([^/]+)$/);
          if (match) repoName = match[1];
        }
        const convertedFiles = files.map(file => ({
          name: file.path as string || 'unnamed_file',
          content: JSON.stringify(file.content),
          isGitHub: true,
          repoName: repoName || undefined
        }))
        setGithubFiles(convertedFiles)
        setRepoName(repoName)
        setShowLayeredOptions(false)
        onChange(convertedFiles)
        setTempData({
          architectureStructure: {
            type: 'file',
            files: convertedFiles
          }
        })
      }
      setIsGitHubModalOpen(false)
    }

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true);
    };

    // 선택지로 전환 (깃허브 모드 → 선택지 모드)
    const handleBackToSelect = () => {
      setGithubFiles(null)
      setRepoName(null)
      setShowLayeredOptions(false)
      setSelectedOption(DEFAULT_ARCHITECTURE_OPTION)
      onChange(DEFAULT_ARCHITECTURE_OPTION)
      setTempData({
        architectureStructure: {
          type: 'selection',
          selection: DEFAULT_ARCHITECTURE_OPTION
        }
      })
    }

    return (
      <div ref={ref} className="mb-10 p-10 bg-white rounded-lg">
        <div className="flex flex-col mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold m-0">{title} {isRequired && <span className="text-red-500">*</span>}</h2>
            </div>
            {/* 깃허브/선택지 전환 버튼 */}
            {githubFiles ? (
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
                onClick={handleBackToSelect}
              >
                선택지에서 선택하기
              </button>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-200 transition-colors"
                onClick={handleGithubUpload}
              >
                <Github size={16} className="text-blue-500" />
                GitHub에서 가져오기
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            프로젝트의 전반적인 구조와 계층을 정의하는 파일입니다. 각 컴포넌트 간의 관계와 책임을 명확히 합니다.
          </p>
        </div>

        {/* 깃허브에서 파일을 추가했을 경우 레포지토리 명 표시 */}
        {githubFiles && repoName && (
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              선택된 레포지토리: {repoName}
            </span>
          </div>
        )}

        {/* 선택지 카드들: 깃허브 모드가 아닐 때만 노출 */}
        {!githubFiles && (
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
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
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
        )}

        {/* 깃허브 모달 */}
        <GitHubRepoBrowser 
          isOpen={isGitHubModalOpen} 
          onClose={() => setIsGitHubModalOpen(false)} 
          onSelect={handleGitHubFileSelect}
          formType="architectureStructure"
          isArchitecture={true}
        />
      </div>
    )
  }
)

ArchitectureStructureForm.displayName = "ArchitectureStructureForm"

export default ArchitectureStructureForm 