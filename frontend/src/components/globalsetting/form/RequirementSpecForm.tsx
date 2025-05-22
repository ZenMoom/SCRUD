'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useProjectTempStore } from '@/store/projectTempStore';
import { File, FileText, Github, Loader2, Upload, X } from 'lucide-react';
import type React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import GitHubRepoBrowser from '../GitHubRepoBrowser';

// 파일 객체 타입 정의
interface FileWithContent {
  name: string;
  content: string;
}

interface RequirementSpecFormProps {
  title: string;
  value: FileWithContent | FileWithContent[];
  onChange: (value: FileWithContent | FileWithContent[]) => void;
  onFocus?: () => void;
  isRequired?: boolean;
}

const RequirementSpecForm = forwardRef<HTMLDivElement, RequirementSpecFormProps>(
  ({ title, value, onChange, onFocus, isRequired }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [fileError, setFileError] = useState<string>('');

    const { tempData, setTempData } = useProjectTempStore();

    // 외부 클릭 감지를 위한 이벤트 리스너
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownOpen &&
          dropdownRef.current &&
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
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
      const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

      if (isFromGithubAuth && isAuthPending && tempData.requirementSpec.length > 0) {
        onChange(tempData.requirementSpec as FileWithContent[]);
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
        const updatedFiles = Array.isArray(value) ? [...value, ...githubFiles] : githubFiles;
        onChange(updatedFiles);
        setTempData({ requirementSpec: updatedFiles });
      }
      setIsGitHubModalOpen(false);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    // 텍스트 파일인지 확인하는 함수
    const isTextFile = (filename: string): boolean => {
      const textExtensions = [
        '.txt',
        '.md',
        '.json',
        '.yml',
        '.yaml',
        '.xml',
        '.html',
        '.css',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.java',
        '.py',
        '.c',
        '.csv',
        '.cpp',
        '.h',
        '.cs',
        '.php',
        '.rb',
        '.go',
        '.rs',
        '.sh',
        '.bat',
        '.ps1',
        '.sql',
        '.properties',
        '.conf',
        '.ini',
        '.env',
        '.gitignore',
        '.gradle',
        '.pom',
        '.lock',
        'Dockerfile',
      ];
      return textExtensions.some((ext) => filename.endsWith(ext));
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (!isTextFile(file.name)) {
          setFileError('텍스트 형식의 파일만 추가할 수 있습니다.');
          return;
        }
        setFileError('');
        const content = await file.text(); // This reads the file as text
        const fileWithContent = {
          name: file.name,
          content: content,
        };
        let newFiles: FileWithContent[];
        if (Array.isArray(value)) {
          newFiles = [...value, fileWithContent];
        } else {
          newFiles = [fileWithContent];
        }
        onChange(newFiles);
        setTempData({ requirementSpec: newFiles });
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

    const handleAddTestData = async () => {
      try {
        setIsLoading(true);
        setFileError('');

        // 파일 경로 설정
        const filePath = '/data/board-requirements.txt';

        // 파일 내용 가져오기
        const response = await fetch(filePath);

        if (!response.ok) {
          throw new Error(`파일을 불러올 수 없습니다: ${response.status}`);
        }

        const content = await response.text();

        const testRequirementSpec = {
          name: 'scrud-requirements.txt',
          content: content,
        };

        let newFiles: FileWithContent[];
        if (Array.isArray(value)) {
          // Check if the test file already exists
          const exists = value.some((file) => file.name === testRequirementSpec.name);
          if (exists) {
            setFileError('테스트 요구사항 파일이 이미 추가되어 있습니다.');
            return;
          }
          newFiles = [...value, testRequirementSpec];
        } else {
          newFiles = [testRequirementSpec];
        }

        onChange(newFiles);
        setTempData({ requirementSpec: newFiles });
      } catch (error) {
        console.error('테스트 데이터 로드 중 오류 발생:', error);
        setFileError('테스트 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div
        ref={ref}
        className='md:p-10 p-6 bg-white rounded-lg'
      >
        <div className='flex flex-col mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='m-0 text-xl font-semibold'>
                {title} {isRequired && <span className='text-red-500'>*</span>}
              </h2>
              <Button
                variant='outline'
                size='sm'
                onClick={handleAddTestData}
                disabled={isLoading}
                className='h-7 flex items-center gap-1 text-xs'
              >
                {isLoading ? (
                  <Loader2
                    size={14}
                    className='animate-spin'
                  />
                ) : (
                  <FileText size={14} />
                )}
                테스트 데이터 추가
              </Button>
            </div>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            요구사항 명세서는 프로젝트의 기능적, 비기능적 요구사항을 상세히 기술한 문서로, SCRUD가 맞춤 정보를 제공하는
            데 필수적입니다.
          </p>
        </div>

        <div className='w-full'>
          {/* 드래그 앤 드롭 영역 */}
          <div
            className={cn(
              'p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer',
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            )}
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
              className='mb-2 text-gray-400'
            />
            <p className='text-sm text-center text-gray-500'>
              요구사항 명세서 파일을 드래그해서 추가하거나
              <br />
              <span className='text-blue-500'>업로드하세요</span>
            </p>
            <div className='mt-2 text-xs text-gray-400'>
              지원 파일 형식: 텍스트 기반 파일 (.txt, .md, .json, .xml, .html, .css, .js, .java, .py 등)
            </div>
            <div className='mt-1 text-xs text-gray-400'>
              Tip: 노션의 내보내기 기능을 이용하면 텍스트 파일로 요구사항 명세서를 저장할 수 있습니다.
            </div>
          </div>

          {/* 드롭다운 메뉴 */}
          {dropdownOpen && (
            <div
              ref={dropdownRef}
              className='relative'
            >
              <Card className='top-2 absolute left-0 z-10 w-full p-0 mt-1 overflow-hidden'>
                <Button
                  variant='ghost'
                  className='hover:bg-gray-100 flex items-center justify-start w-full gap-2 px-4 py-3 text-left rounded-none'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGithubUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Github
                    size={16}
                    className='text-gray-500'
                  />
                  <span>GitHub에서 가져오기</span>
                </Button>
                <Button
                  variant='ghost'
                  className='hover:bg-gray-100 flex items-center justify-start w-full gap-2 px-4 py-3 text-left rounded-none'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileUpload();
                    setDropdownOpen(false);
                  }}
                >
                  <Upload
                    size={16}
                    className='text-gray-500'
                  />
                  <span>파일 업로드</span>
                </Button>
              </Card>
            </div>
          )}

          <input
            id={`file-upload-${title}`}
            type='file'
            className='hidden'
            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                const invalid = filesArray.find((file) => !isTextFile(file.name));
                if (invalid) {
                  setFileError('텍스트 형식의 파일만 추가할 수 있습니다.');
                  return;
                }
                setFileError('');
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
                setTempData({ requirementSpec: newFiles });
              }
            }}
            multiple
          />

          {fileError && <div className='mt-2 text-xs text-red-500'>{fileError}</div>}

          {/* 선택된 파일 표시 */}
          {Array.isArray(value) && value.length > 0 && (
            <div className='mt-4'>
              <p className='mb-2 text-sm font-medium'>선택된 파일: {value.length}개</p>
              <div className='flex flex-col space-y-2'>
                {value.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg'
                  >
                    <div className='max-w-[80%] flex items-center gap-2'>
                      <File
                        size={16}
                        className='flex-shrink-0 text-gray-500'
                      />
                      <span className='truncate'>{file.name}</span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='hover:bg-gray-200 flex-shrink-0 w-6 h-6 p-0 rounded-full'
                      onClick={() => {
                        const newFiles = [...value];
                        newFiles.splice(index, 1);
                        onChange(newFiles);
                        setTempData({ requirementSpec: newFiles });
                      }}
                    >
                      <X
                        size={14}
                        className='text-red-500'
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 단 값인 경우와 호환성 유지 */}
          {!Array.isArray(value) && value && (
            <div className='flex items-center gap-2 px-4 py-2 mt-4 text-sm text-gray-700 bg-gray-100 rounded-lg'>
              <File
                size={16}
                className='text-gray-500'
              />
              <span className='truncate'>{value.name}</span>
            </div>
          )}

          {/* GitHub 레포지토리 브라우저 모달 */}
          <GitHubRepoBrowser
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onSelect={handleGitHubFileSelect}
            formType='requirementSpec'
          />
        </div>
      </div>
    );
  }
);

RequirementSpecForm.displayName = 'RequirementSpecForm';

export default RequirementSpecForm;
