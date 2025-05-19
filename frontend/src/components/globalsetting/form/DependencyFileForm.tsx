"use client"

import { forwardRef, useState, useRef, useEffect } from "react"
import { Upload, Github, File} from "lucide-react"
import GitHubRepoBrowser from "../GitHubRepoBrowser"
import { useProjectTempStore } from "@/store/projectTempStore"

interface FileData {
  name: string;
  content: string;
  isGitHub?: boolean;
}

interface DependencyFileFormProps {
  title: string;
  onFileSelect: (file: FileData) => void;
  onFocus?: () => void;
}

const DependencyFileForm = forwardRef<HTMLDivElement, DependencyFileFormProps>(
  ({ title, onFileSelect, onFocus }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<FileData[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    const { tempData, setTempData } = useProjectTempStore();

    // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const isFromGithubAuth = params.get('from') === 'github-auth';
      const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

      if (isFromGithubAuth && isAuthPending && tempData.dependencyFile.length > 0) {
        console.log('의존성 파일 임시저장 데이터:', tempData.dependencyFile);
        // 한 번에 상태 업데이트
        setSelectedFiles(tempData.dependencyFile as FileData[]);
        // 각 파일에 대해 한 번만 onFileSelect 호출
        tempData.dependencyFile.forEach(file => onFileSelect(file as FileData));
      }
    }, []);

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

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string, content: string }>) => {
      if (files.length > 0) {
        // 각 파일을 개별적으로 처리
        const newFiles = files.map(file => ({
          name: file.path,
          content: file.content,
          isGitHub: true
        }));
        
        setSelectedFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
          onFileSelect(file);
        });
        setTempData({ dependencyFile: newFiles });
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
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const content = await file.text();
        const newFile = {
          name: file.name,
          content: content
        };
        const newFiles = [...selectedFiles, newFile];
        setSelectedFiles(newFiles);
        onFileSelect(newFile);
        setTempData({ dependencyFile: newFiles });
      }
    };

    const handleFileUpload = () => {
      setDropdownOpen(false)
      document.getElementById(`file-upload-${title}`)?.click()
    }

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true);
    }

    return (
      <div ref={ref} >
        <div className="flex flex-col mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="m-0 text-xl font-semibold">
                {title}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            프로젝트에서 사용할 외부 라이브러리와 프레임워크의 의존성 정보를 관리하는 파일입니다.
          </p>
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
              if (onFocus) onFocus();
              setDropdownOpen(!dropdownOpen);
            }}
            ref={buttonRef}
          >
            <Upload size={24} className="text-gray-400 mb-2" />
            <p className="text-gray-500 text-center text-sm">
              의존성 파일을 드래그해서 추가하거나<br />
              <span className="text-blue-500">업로드하세요</span>
            </p>
            <div className="mt-2 text-xs text-gray-400">
              지원 파일 형식: .txt, .md, .doc, .docx, .pdf 등
            </div>

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
                    if (onFocus) onFocus();
                    handleGithubUpload();
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
                    if (onFocus) onFocus();
                    handleFileUpload();
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
                const newFile = {
                  name: file.name,
                  content: content
                };
                const newFiles = [...selectedFiles, newFile];
                setSelectedFiles(newFiles);
                onFileSelect(newFile);
                setTempData({ dependencyFile: newFiles });
              }
            }}
          />
          
          {/* 선택된 파일 표시 */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">선택된 파일: {selectedFiles.length}개</p>
              <div className="flex flex-col space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <File size={16} className="text-gray-500" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index);
                        setSelectedFiles(newFiles);
                        // 파일 삭제 시 빈 content로 전달하지 않고 삭제된 상태만 반영
                        setTempData({ dependencyFile: newFiles });
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

          {/* GitHub 레포지토리 브라우저 모달 */}
          {isGitHubModalOpen && (
            <GitHubRepoBrowser
              isOpen={isGitHubModalOpen}
              onClose={() => setIsGitHubModalOpen(false)}
              onSelect={handleGitHubFileSelect}
              formType="dependencyFile"
            />
          )}
        </div>
      </div>
    )
  }
)

DependencyFileForm.displayName = "DependencyFileForm"

export default DependencyFileForm 