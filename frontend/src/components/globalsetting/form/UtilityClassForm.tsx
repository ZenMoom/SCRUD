'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useProjectTempStore } from '@/store/projectTempStore';
import { File, Github, Upload, X } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import GitHubRepoBrowser from '../GitHubRepoBrowser';

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
        const updatedFiles = Array.isArray(value) ? [...value, ...githubFiles] : githubFiles;
        onChange(updatedFiles);
        setTempData({ utilityClass: updatedFiles });
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
        const content = await file.text();
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
        className='md:px-10 p-6 py-5 mb-8 bg-white rounded-lg'
      >
        <div className='flex flex-col mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <h2 className='m-0 text-xl font-semibold'>
                {title} {isRequired && <span className='text-red-500'>*</span>}
              </h2>
            </div>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            프로젝트에서 공통적으로 사용되는 기능(유틸리티 메서드)을 모아두는 클래스들입니다. 중복 코드를 줄이고 코드의
            재사용성을 높입니다.
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
              유틸리티 클래스 파일을 드래그해서 추가하거나
              <br />
              <span className='text-blue-500'>업로드하세요</span>
            </p>
            <div className='mt-2 text-xs text-gray-400'>
              지원 파일 형식: 텍스트 기반 파일 (.txt, .md, .json, .xml, .html, .css, .js, .java, .py 등)
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
                setTempData({ utilityClass: newFiles });
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
                        setTempData({ utilityClass: newFiles });
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

          {/* 단일 값인 경우와 호환성 유지 */}
          {!Array.isArray(value) && value && (
            <div className='flex items-center gap-2 px-4 py-2 mt-4 text-sm text-gray-700 bg-gray-100 rounded-lg'>
              <File
                size={16}
                className='text-gray-500'
              />
              <span>{value.name}</span>
            </div>
          )}

          {/* GitHub 레포지토리 브라우저 모달 */}
          <GitHubRepoBrowser
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onSelect={handleGitHubFileSelect}
            formType='utilityClass'
          />
        </div>
      </div>
    );
  }
);

UtilityClassForm.displayName = 'UtilityClassForm';

export default UtilityClassForm;
