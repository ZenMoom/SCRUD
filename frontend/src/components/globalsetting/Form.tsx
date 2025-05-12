"use client"

import { forwardRef, useState, useEffect, useRef } from "react"
import { HelpCircle, Upload, Github, File } from "lucide-react"
import { getGitHubAuthUrl } from "@/auth/github"
import GitHubRepoBrowser from "./GitHubRepoBrowser"

interface FormItemProps {
  title: string
  type: 'text' | 'textarea' | 'file' | 'dependency-select' | 'security-select' | 'architecture-select'
  value: string | string[]
  onChange: (value: string | string[]) => void
  onInfoClick: () => void
  options?: Array<{ value: string; label: string }>
  onFocus?: () => void
  isRequired?: boolean
}

const FormItem = forwardRef<HTMLDivElement, FormItemProps>(({ title, type, value, onChange, onInfoClick, options, onFocus }, ref) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
  const [inputType, setInputType] = useState<'file' | 'github' | 'select' | 'default'>('default')
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const [dependencySearchTerm, setDependencySearchTerm] = useState('')
  const [layeredSubType, setLayeredSubType] = useState<'A' | 'B'>('A')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  
  // GitHub에서 파일 선택 시 호출될 핸들러
  const handleGitHubFileSelect = (files: Array<{ path: string, downloadUrl?: string }>) => {
    // 의존성 선택 정보 유지하면서 GitHub 파일 경로 추가
    if ((type as string) === 'dependency-select' && selectedDependencies.length > 0) {
      // 선택된 의존성 정보는 그대로 유지
      onChange(selectedDependencies.join(','));
    } else if (files.length > 0) {
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
  
  // 의존성 목록 - spring.io에서 가져온 샘플 데이터
  const springDependencies = [
    { id: 'web', name: 'Spring Web', description: 'Build web applications using Spring MVC' },
    { id: 'data-jpa', name: 'Spring Data JPA', description: 'Persist data in SQL stores with Java Persistence API' },
    { id: 'security', name: 'Spring Security', description: 'Highly customizable authentication and access-control' },
    { id: 'mysql', name: 'MySQL Driver', description: 'MySQL JDBC driver' },
    { id: 'postgresql', name: 'PostgreSQL Driver', description: 'PostgreSQL JDBC driver' },
    { id: 'lombok', name: 'Lombok', description: 'Java annotation library to reduce boilerplate code' },
    { id: 'thymeleaf', name: 'Thymeleaf', description: 'Server-side Java template engine' },
    { id: 'validation', name: 'Validation', description: 'Bean Validation with Hibernate validator' },
    // 더 많은 의존성 추가 가능
  ];
  
  // 검색어에 맞는 의존성 필터링
  const filteredDependencies = springDependencies.filter(
    dep => dep.name.toLowerCase().includes(dependencySearchTerm.toLowerCase())
  );
  
  // 의존성 선택/해제 핸들러
  const toggleDependency = (depId: string) => {
    // 새로운 의존성 배열 계산
    const newDependencies = selectedDependencies.includes(depId)
      ? selectedDependencies.filter(id => id !== depId)
      : [...selectedDependencies, depId];
    
    // selectedDependencies 상태 업데이트 
    setSelectedDependencies(newDependencies);
    
    // 의존성 선택에 관계없이 파일 경로가 있는 경우 (파일 업로드 또는 GitHub) 유지
    if ((type as string) === 'dependency-select') {
      // 선택된 의존성이 있으면 콤마로 구분된 문자열로 반환
      if (newDependencies.length > 0) {
        onChange(newDependencies.join(','));
      } else {
        // 선택된 의존성이 없으면 빈 문자열
        onChange('');
      }
    } else {
      // 다른 타입은 변경 없음
      onChange(newDependencies.join(','));
    }
  };
  
  // 입력 타입 변경 핸들러
  const handleInputTypeChange = (newType: 'file' | 'github' | 'select' | 'default') => {
    setInputType(newType);
    setDropdownOpen(false);
    
    // 타입이 dependency-select가 아닐 때만 값 초기화
    if ((type as string) !== 'dependency-select' && newType === 'select') {
      onChange('');
    }
    // selectedDependencies 배열은 항상 유지 - 초기화하지 않음
  };
  
  // 컴포넌트 마운트 시 타입에 따라 초기 입력 타입 설정
  useEffect(() => {
    if ((type as string) === 'dependency-select') {
      setInputType('select');
    } else if ((type as string) === 'security-select') {
      setInputType('select');
    } else if ((type as string) === 'architecture-select') {
      setInputType('select');
      
      // 레이어드 아키텍처 타입 설정
      if (value === 'ARCHITECTURE_DEFAULT_LAYERED_A') {
        setLayeredSubType('A');
      } else if (value === 'ARCHITECTURE_DEFAULT_LAYERED_B') {
        setLayeredSubType('B');
      }
    } else if (typeof value === 'string' && value.startsWith('github:')) {
      setInputType('github');
    } else if (typeof value === 'string' && value && !value.startsWith('github:')) {
      setInputType('file');
    } else if (Array.isArray(value) && value.length > 0) {
      // 배열인 경우 file 타입으로 설정
      setInputType('file');
    } else {
      setInputType('default');
    }
    
    // 의존성 값이 있으면 파싱하여 설정
    if ((type as string) === 'dependency-select' && typeof value === 'string' && value) {
      setSelectedDependencies(value.split(','));
    }
  }, [type, value]);

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
            placeholder={`${title} 입력...`}
            onFocus={onFocus}
          />
        )
      case "textarea":
        return (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            placeholder={`${title} 입력...`}
            onFocus={onFocus}
          />
        )
      case "file":
        return (
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
              onClick={() => setDropdownOpen(!dropdownOpen)}
              ref={buttonRef}
            >
              <Upload size={24} className="text-gray-400 mb-2" />
              <p className="text-gray-500 text-center text-sm">
                파일을 드래그해서 추가하거나 <br /> 
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
                  // 파일 업로드 시에도 의존성 정보 유지
                  // type이 dependency-select인 경우 selectedDependencies로 value를 설정
                  if ((type as string) === 'dependency-select' && selectedDependencies.length > 0) {
                    // 태그는 그대로 유지하고 파일명 정보만 따로 저장하거나 처리 가능
                    // 이 경우는 선택된 의존성 정보를 우선시
                    onChange(selectedDependencies.join(','));
                  } else {
                    // 현재 value가 배열인 경우 새 파일을 추가
                    if (Array.isArray(value)) {
                      onChange([...value, fileName]);
                    } else {
                      // 배열이 아닌 경우 단일 항목 배열로 설정
                      onChange([fileName]);
                    }
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
                        <span className="truncate">{file}</span>
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

            {/* 단일 값인 경우와 호환성 유지 (의존성 선택 등) */}
            {!Array.isArray(value) && value && !value.includes(',') && (type as string) !== 'dependency-select' && (
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
      case "security-select":
        return (
          <div className="w-full">
            {inputType === 'select' && (
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
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  ref={buttonRef}
                >
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-gray-500 text-center text-sm">
                    파일을 드래그해서 추가하거나 <br /> 
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
                      // 파일 업로드 시에도 의존성 정보 유지
                      // type이 dependency-select인 경우 selectedDependencies로 value를 설정
                      if ((type as string) === 'dependency-select' && selectedDependencies.length > 0) {
                        // 태그는 그대로 유지하고 파일명 정보만 따로 저장하거나 처리 가능
                        // 이 경우는 선택된 의존성 정보를 우선시
                        onChange(selectedDependencies.join(','));
                      } else {
                        // 현재 value가 배열인 경우 새 파일을 추가
                        if (Array.isArray(value)) {
                          onChange([...value, fileName]);
                        } else {
                          // 배열이 아닌 경우 단일 항목 배열로 설정
                          onChange([fileName]);
                        }
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
                            <span className="truncate">{file}</span>
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

                {/* 단일 값인 경우와 호환성 유지 (의존성 선택 등) */}
                {!Array.isArray(value) && value && !value.includes(',') && (type as string) !== 'dependency-select' && (
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
            )}
          </div>
        )
      case "architecture-select":
        return (
          <div className="w-full">
            {inputType === 'select' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {options?.map((option) => (
                    <div 
                      key={option.value} 
                      className={`rounded-lg border overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md ${
                        value === option.value 
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
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  ref={buttonRef}
                >
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-gray-500 text-center text-sm">
                    파일을 드래그해서 추가하거나 <br /> 
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
                      // 파일 업로드 시에도 의존성 정보 유지
                      // type이 dependency-select인 경우 selectedDependencies로 value를 설정
                      if ((type as string) === 'dependency-select' && selectedDependencies.length > 0) {
                        // 태그는 그대로 유지하고 파일명 정보만 따로 저장하거나 처리 가능
                        // 이 경우는 선택된 의존성 정보를 우선시
                        onChange(selectedDependencies.join(','));
                      } else {
                        // 현재 value가 배열인 경우 새 파일을 추가
                        if (Array.isArray(value)) {
                          onChange([...value, fileName]);
                        } else {
                          // 배열이 아닌 경우 단일 항목 배열로 설정
                          onChange([fileName]);
                        }
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
                            <span className="truncate">{file}</span>
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

                {/* 단일 값인 경우와 호환성 유지 (의존성 선택 등) */}
                {!Array.isArray(value) && value && !value.includes(',') && (type as string) !== 'dependency-select' && (
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
            )}
          </div>
        )
      case "dependency-select":
        return (
          <div className="w-full">            
            {/* 선택된 의존성 표시 - 항상 표시 (모든 입력 모드에서) */}
            {selectedDependencies.length > 0 && (
              <div className="mb-4">
                <div className="font-medium mb-2">선택된 의존성:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDependencies.map(id => {
                    const dep = springDependencies.find(d => d.id === id);
                    return (
                      <div key={id} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                        <span>{dep?.name || id}</span>
                        <button 
                          className="ml-2 text-gray-500 hover:text-gray-700"
                          onClick={() => toggleDependency(id)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {inputType === 'select' && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* 의존성 검색 입력 */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="의존성 검색..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={dependencySearchTerm}
                    onChange={(e) => setDependencySearchTerm(e.target.value)}
                  />
                </div>
                
                {/* 의존성 목록 */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredDependencies.map(dep => (
                    <label key={dep.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(dep.id)}
                        onChange={() => toggleDependency(dep.id)}
                        className="w-4 h-4 text-blue-500 mr-3"
                      />
                      <div>
                        <div className="font-medium">{dep.name}</div>
                        <div className="text-sm text-gray-500">{dep.description}</div>
                      </div>
                    </label>
                  ))}
                  
                  {filteredDependencies.length === 0 && (
                    <div className="p-3 text-center text-gray-500">검색 결과가 없습니다</div>
                  )}
                </div>
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
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  ref={buttonRef}
                >
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-gray-500 text-center text-sm">
                    파일을 드래그해서 추가하거나 <br /> 
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
                      // 파일 업로드 시에도 의존성 정보 유지
                      if ((type as string) === 'dependency-select' && selectedDependencies.length > 0) {
                        // 선택된 의존성 정보 유지
                        onChange(selectedDependencies.join(','));
                      } else {
                        // 현재 value가 배열인 경우 새 파일을 추가
                        if (Array.isArray(value)) {
                          onChange([...value, fileName]);
                        } else {
                          // 배열이 아닌 경우 단일 항목 배열로 설정
                          onChange([fileName]);
                        }
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
                            <span className="truncate">{file}</span>
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

                {/* 단일 값인 경우와 호환성 유지 (의존성 선택 등) */}
                {!Array.isArray(value) && value && !value.includes(',') && (type as string) !== 'dependency-select' && (
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
            )}
          </div>
        )
      default:
        return null
    }
  }

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
      // 파일 드롭 시 타입에 따른 처리
      const fileName = e.dataTransfer.files[0].name;
      // 드롭한 파일을 현재 값 배열에 추가
      if (Array.isArray(value)) {
        onChange([...value, fileName]);
      } else {
        // 배열이 아닌 경우 새 배열 생성
        onChange([fileName]);
      }
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
          const oauthUrl = getGitHubAuthUrl('http://localhost:3000/globalsetting');
          window.location.href = oauthUrl;
        }
      } else {
        // 토큰이 없는 경우 바로 인증 요청
        console.log('GitHub 토큰 없음, 인증 요청');
        const oauthUrl = getGitHubAuthUrl('http://localhost:3000/globalsetting');
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

        {/* 입력 방식 선택 버튼을 제목 오른쪽으로 이동 */}
        {((type as string) === 'dependency-select' || (type as string) === 'security-select' || (type as string) === 'architecture-select') && (
          <button
            type="button"
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleInputTypeChange(inputType === 'select' ? 'file' : 'select')}
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
        )}
      </div>
      {renderInputComponent()}
    </div>
  )
})

FormItem.displayName = "FormItem"

export default FormItem