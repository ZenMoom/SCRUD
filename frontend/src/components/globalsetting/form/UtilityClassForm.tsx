"use client";

import { File, Github, Upload } from "lucide-react";
import { forwardRef, useRef, useState, useEffect } from "react";
import GitHubRepoBrowser from "../GitHubRepoBrowser";
import { useProjectTempStore } from "@/store/projectTempStore";

interface FileWithContent {
  name: string;
  content: string;
}

interface UtilityClassFormProps {
  title: string;
  value: FileWithContent | FileWithContent[];
  onChange: (value: FileWithContent | FileWithContent[]) => void;
  onFocus?: () => void;
  isRequired?: boolean;
}

const UtilityClassForm = forwardRef<HTMLDivElement, UtilityClassFormProps>(
  ({ title, value, onChange, onFocus, isRequired }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    const { tempData, setTempData } = useProjectTempStore();

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
      const params = new URLSearchParams(window.location.search);
      const isFromGithubAuth = params.get('from') === 'github-auth';

      if (isFromGithubAuth) {
  
        if (tempData.utilityClass.length > 0) {
          onChange(tempData.utilityClass as FileWithContent[]);
        }
      }
    }, []);

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string; content: string }>) => {
      if (files.length > 0) {
        const githubFiles = files.map((file) => ({
          name: file.path,
          content: file.content,
          isGitHub: true,
        }));
        onChange(githubFiles);
        setTempData({ utilityClass: githubFiles });
      }
      setIsGitHubModalOpen(false);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const content = await file.text();
        const fileWithContent = {
          name: file.name,
          content: content,
        };

        // 드롭한 파일을 현재 값 배열에 추가
        let newFiles: FileWithContent[];
        if (Array.isArray(value)) {
          newFiles = [...value, fileWithContent];
        } else {
          // 배열이 아닌 경우 새 배열 생성
          newFiles = [fileWithContent];
        }
        onChange(newFiles);
        setTempData({ utilityClass: newFiles });
      }
    };

    const handleFileUpload = () => {
      setDropdownOpen(false);
      // 파일 선택 다이얼로그 트리거
      document.getElementById(`file-upload-${title}`)?.click();
    };

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true); // 인증 로직 없이 바로 모달 열기
    };

    return (
      <div
        ref={ref}
        className="p-10 mb-10 bg-white rounded-lg"
      >
        <div className="flex flex-col mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="m-0 text-xl font-semibold">
                {title} {isRequired && <span className="text-red-500">*</span>}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            프로젝트에서 공통적으로 사용되는 기능(유틸리티 메서드)을 모아두는 클래스들입니다. 중복 코드를 줄이고 코드의 재사용성을 높입니다.
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
            <Upload
              size={24}
              className="mb-2 text-gray-400"
            />
            <p className="text-sm text-center text-gray-500">
              유틸리티 클래스 파일을 드래그해서 추가하거나<br />
              <span className="text-blue-500">업로드하세요</span>
            </p>
            <div className="mt-2 text-xs text-gray-400">
              지원 파일 형식: .txt, .md, .doc, .docx, .pdf 등
            </div>

          </div>

          {/* 드롭다운 메뉴 */}
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className="relative"
            >
              <div className="top-2 absolute left-0 z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  type="button"
                  className="hover:bg-gray-100 first:rounded-t-lg flex items-center w-full gap-2 px-4 py-3 text-left transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGithubUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Github
                    size={16}
                    className="text-gray-500"
                  />
                  <span>GitHub에서 가져오기</span>
                </button>
                <button
                  type="button"
                  className="hover:bg-gray-100 last:rounded-b-lg flex items-center w-full gap-2 px-4 py-3 text-left transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Upload
                    size={16}
                    className="text-gray-500"
                  />
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
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                const filePromises = filesArray.map(async (file) => {
                  const content = await file.text();
                  return {
                    name: file.name,
                    content,
                  };
                });

                const filesWithContent = await Promise.all(filePromises);
                let newFiles: FileWithContent[];
                if (Array.isArray(value)) {
                  newFiles = [...value, ...filesWithContent];
                } else {
                  newFiles = filesWithContent;
                }
                onChange(newFiles);
                setTempData({ utilityClass: newFiles });
              }
            }}
            multiple
          />

          {/* 선택된 파일 표시 */}
          {Array.isArray(value) && value.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">선택된 파일: {value.length}개</p>
              <div className="flex flex-col space-y-2">
                {value.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <File
                        size={16}
                        className="text-gray-500"
                      />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = [...value];
                        newFiles.splice(index, 1);
                        onChange(newFiles);
                        setTempData({ utilityClass: newFiles });
                      }}
                      className="hover:text-red-700 ml-2 text-red-500"
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
            <div className="flex items-center gap-2 px-4 py-2 mt-4 text-sm text-gray-700 bg-gray-100 rounded-lg">
              <File
                size={16}
                className="text-gray-500"
              />
              <span>{value.name}</span>
            </div>
          )}

          {/* GitHub 레포지토리 브라우저 모달 */}
          <GitHubRepoBrowser
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onSelect={handleGitHubFileSelect}
            formType="utilityClass"
          />
        </div>
      </div>
    );
  }
);

UtilityClassForm.displayName = "UtilityClassForm";

export default UtilityClassForm;
