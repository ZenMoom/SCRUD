"use client"

import { forwardRef, useState, useRef } from "react"
import { Upload, Github, File } from "lucide-react"
import GitHubRepoBrowser from "../GitHubRepoBrowser"

interface DependencyFileFormProps {
  title: string;
  onFileSelect: (file: { fileName: string; fileContent: string }) => void;
  onFocus?: () => void;
}

const DependencyFileForm = forwardRef<HTMLDivElement, DependencyFileFormProps>(
  ({ title, onFileSelect, onFocus }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<Array<{ fileName: string; fileContent: string }>>([])
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string, content: string }>) => {
      if (files.length > 0) {
        // 각 파일을 개별적으로 처리
        files.forEach(file => {
          const newFile = {
            fileName: file.path,
            fileContent: file.content
          };
          setSelectedFiles(prev => [...prev, newFile]);
          onFileSelect(newFile);
        });
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
          fileName: file.name,
          fileContent: content
        };
        setSelectedFiles(prev => [...prev, newFile]);
        onFileSelect(newFile);
      }
    };

    const handleFileUpload = () => {
      setDropdownOpen(false)
      document.getElementById(`file-upload-${title}`)?.click()
    }

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true); // 인증 로직 없이 바로 모달 열기
    }

    return (
      <div ref={ref}>
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
              의존성 파일을 드래그해서 추가하거나 <br /> 
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
                  fileName: file.name,
                  fileContent: content
                };
                setSelectedFiles(prev => [...prev, newFile]);
                onFileSelect(newFile);
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
                      <span className="truncate">{file.fileName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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