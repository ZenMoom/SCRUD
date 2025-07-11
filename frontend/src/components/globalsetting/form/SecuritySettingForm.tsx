'use client';

import { useProjectTempStore } from '@/store/projectTempStore';
import { File, Github, Upload } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import GitHubRepoBrowser from '../GitHubRepoBrowser';
import SecuritySelector from './SecuritySelector';

interface FileWithContent {
  name: string;
  content: string;
  isGitHub?: boolean;
}

interface SelectionValue {
  type: string;
  label: string;
}

interface SecuritySettingFormProps {
  title: string;
  value: FileWithContent[] | SelectionValue;
  onChange: (value: FileWithContent | FileWithContent[] | { type: string; label: string }) => void;
  onFocus?: () => void;
  isRequired?: boolean;
}

const SecuritySettingForm = forwardRef<HTMLDivElement, SecuritySettingFormProps>(
  ({ title, value, onChange, onFocus, isRequired }, ref) => {
    void value;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileWithContent[]>([]);
    const [isFileMode, setIsFileMode] = useState(false);
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

      if (isFromGithubAuth && isAuthPending && tempData.securitySetting) {
        if (tempData.securitySetting.type === 'selection' && tempData.securitySetting.selection) {
          setIsFileMode(false);
          onChange(tempData.securitySetting.selection);
        } else if (tempData.securitySetting.type === 'file' && tempData.securitySetting.files) {
          setIsFileMode(true);
          const files = tempData.securitySetting.files.map((file) => ({
            name: file.name || '',
            content: typeof file.content === 'string' ? file.content : JSON.stringify(file.content),
            isGitHub: file.isGitHub,
          }));
          setSelectedFiles(files);
          onChange(files);
        }
      }
    }, []);

    const toggleMode = () => {
      setIsFileMode(!isFileMode);
      if (isFileMode) {
        // 파일 모드에서 선택지 모드로 전환
        setSelectedFiles([]);
        setTempData({
          securitySetting: {
            type: 'selection',
            selection: { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
          },
        });
        onChange({ type: 'SECURITY_DEFAULT_JWT', label: 'JWT' });
      } else {
        // 선택지 모드에서 파일 모드로 전환
        setTempData({
          securitySetting: {
            type: 'file',
            files: [],
          },
        });
        onChange([]);
      }
    };

    const handleGitHubFileSelect = (files: Array<{ path: string; content: string }>) => {
      if (files.length > 0) {
        const githubFiles = files.map((file) => ({
          name: file.path,
          content: file.content,
          isGitHub: true,
        }));
        const updatedFiles = [...selectedFiles, ...githubFiles];
        setSelectedFiles(updatedFiles);
        onChange(updatedFiles);
        setTempData({
          securitySetting: {
            type: 'file',
            files: updatedFiles,
          },
        });
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
        const updatedFiles = [fileWithContent];
        setSelectedFiles(updatedFiles);
        onChange(updatedFiles);
        setTempData({
          securitySetting: {
            type: 'file',
            files: updatedFiles,
          },
        });
      }
    };

    const handleSecuritySelect = (selection: { type: string; label: string }) => {
      setIsFileMode(false);
      onChange(selection);
      setTempData({
        securitySetting: {
          type: 'selection',
          selection: selection,
        },
      });
    };

    const handleFileUpload = () => {
      setDropdownOpen(false);
      document.getElementById(`file-upload-${title}`)?.click();
    };

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true);
    };

    return (
      <div
        ref={ref}
        className='px-10 py-5 mb-10 bg-white rounded-lg'
      >
        <div className='flex flex-col mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <h2 className='m-0 text-xl font-semibold'>
                {title} {isRequired && <span className='text-red-500'>*</span>}
              </h2>
            </div>
            <button
              type='button'
              className='hover:text-blue-700 flex items-center text-sm text-blue-500'
              onClick={toggleMode}
            >
              {isFileMode ? (
                <>선택지에서 선택하기</>
              ) : (
                <>
                  <Upload
                    size={14}
                    className='mr-1'
                  />
                  파일 추가하기
                </>
              )}
            </button>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            인증/인가 처리, CORS 정책, 비밀번호 암호화, JWT 등 보안과 관련된 설정 파일입니다.
          </p>
        </div>

        {!isFileMode ? (
          <SecuritySelector onSelect={handleSecuritySelect} />
        ) : (
          <div className='w-full'>
            {/* 드래그 앤 드롭 영역 */}
            <div
              className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
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
                className='mb-2 text-gray-400'
              />
              <p className='text-sm text-center text-gray-500'>
                보안 설정 파일을 드래그해서 추가하거나 <br />
                <span className='text-blue-500'>업로드하세요</span>
              </p>
              <div className='mt-2 text-xs text-gray-400'>지원 파일 형식: .txt, .md, .doc, .docx, .pdf 등</div>
            </div>

            {/* 드롭다운 메뉴 */}
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className='relative'
              >
                <div className='top-2 absolute left-0 z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg'>
                  <button
                    type='button'
                    className='hover:bg-gray-100 first:rounded-t-lg flex items-center w-full gap-2 px-4 py-3 text-left transition-colors duration-150'
                    onClick={() => {
                      if (onFocus) onFocus();
                      handleGithubUpload();
                      setDropdownOpen(false);
                    }}
                  >
                    <Github
                      size={16}
                      className='text-gray-500'
                    />
                    <span>GitHub에서 가져오기</span>
                  </button>
                  <button
                    type='button'
                    className='hover:bg-gray-100 last:rounded-b-lg flex items-center w-full gap-2 px-4 py-3 text-left transition-colors duration-150'
                    onClick={() => {
                      if (onFocus) onFocus();
                      handleFileUpload();
                      setDropdownOpen(false);
                    }}
                  >
                    <Upload
                      size={16}
                      className='text-gray-500'
                    />
                    <span>파일 업로드</span>
                  </button>
                </div>
              </div>
            )}

            <input
              id={`file-upload-${title}`}
              type='file'
              className='hidden'
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
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
                  const updatedFiles = [fileWithContent];
                  setSelectedFiles(updatedFiles);
                  onChange(updatedFiles);
                  setTempData({
                    securitySetting: {
                      type: 'file',
                      files: updatedFiles,
                    },
                  });
                }
              }}
            />

            {fileError && <div className='mt-2 text-xs text-red-500'>{fileError}</div>}

            {/* 선택된 파일 표시 */}
            {selectedFiles.length > 0 && (
              <div className='mt-4'>
                <p className='mb-2 text-sm font-medium'>선택된 파일: {selectedFiles.length}개</p>
                <div className='flex flex-col space-y-2'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg'
                    >
                      <div className='flex items-center gap-2'>
                        <File
                          size={16}
                          className='text-gray-500'
                        />
                        <span className='truncate'>{file.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updatedFiles = selectedFiles.filter((_, i) => i !== index);
                          setSelectedFiles(updatedFiles);
                          onChange(updatedFiles);
                          setTempData({
                            securitySetting: {
                              type: 'file',
                              files: updatedFiles,
                            },
                          });
                        }}
                        className='hover:text-red-700 ml-2 text-red-500'
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GitHub 레포지토리 브라우저 모달 */}
        <GitHubRepoBrowser
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          onSelect={handleGitHubFileSelect}
          formType='securitySetting'
        />
      </div>
    );
  }
);

SecuritySettingForm.displayName = 'SecuritySettingForm';

export default SecuritySettingForm;
