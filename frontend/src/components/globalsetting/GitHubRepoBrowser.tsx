'use client';

import { getGitHubAuthUrl } from '@/auth/github';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useGitHubTokenStore } from '@/store/githubTokenStore';
import { Check, ChevronLeft, FileIcon, Folder, Github, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

// 레포지토리 타입 정의
interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

// 콘텐츠 아이템 타입 정의
interface ContentItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size?: number;
  download_url?: string;
  html_url: string;
}

interface GitHubRepoBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    files: Array<{
      path: string;
      downloadUrl?: string;
      content: string;
      fileType?: string;
      fileName?: string;
      isGitHub: boolean;
    }>
  ) => void;
  isArchitecture?: boolean; // 아키텍처 구조도 선택 모드인지 여부
  formType?: string; // 폼 타입 추가
}

// 기존 인터페이스에 type 필드 추가
interface SelectedItem {
  path: string;
  type: 'file' | 'directory' | 'repository';
  content: string; // content를 필수 string 타입으로 변경
  downloadUrl?: string;
  repoInfo?: {
    name: string;
    owner: string;
  };
}

const GitHubRepoBrowser: React.FC<GitHubRepoBrowserProps> = ({
  isOpen,
  onClose,
  onSelect,
  isArchitecture = false,
  formType,
}) => {
  const { githubToken } = useGitHubTokenStore();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [error, setError] = useState<string>('');
  // 아키텍처 모드에서 전체 레포지토리 로딩 상태
  const [isLoadingFullRepo, setIsLoadingFullRepo] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // GitHub 인증 확인 및 처리
  useEffect(() => {
    if (isOpen) {
      checkGitHubAuth();
    }
  }, [isOpen]);

  // 외부 클릭 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // GitHub 인증 확인하는 함수
  const checkGitHubAuth = async () => {
    const storedToken = localStorage.getItem('github-token-direct');
    const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URI;

    try {
      if (storedToken) {
        const response = await fetch('/api/github/user/repos', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          // 토큰이 유효하지 않은 경우 (401 등)
          console.error('GitHub 토큰이 유효하지 않음, 재인증 요청');

          // 토큰 삭제
          localStorage.removeItem('github-token-direct');

          // 현재 상태를 임시저장
          localStorage.setItem('github-auth-pending', 'true');

          // 인증 요청 (상태 파라미터 추가)
          const oauthUrl = getGitHubAuthUrl(`${REDIRECT_URL}/globalsetting?from=github-auth`);
          window.location.href = oauthUrl;
          return;
        }
      } else {
        // 현재 상태를 임시저장
        localStorage.setItem('github-auth-pending', 'true');

        // 인증 요청 (상태 파라미터 추가)
        const oauthUrl = getGitHubAuthUrl(`${REDIRECT_URL}/globalsetting?from=github-auth`);
        window.location.href = oauthUrl;
        return;
      }
    } catch (error) {
      console.error('GitHub 토큰 검증 중 오류 발생:', error);
      // 오류 발생시 토큰 삭제 후 재인증
      localStorage.removeItem('github-token-direct');

      // 현재 상태를 임시저장
      localStorage.setItem('github-auth-pending', 'true');

      // 인증 요청 (상태 파라미터 추가)
      const oauthUrl = getGitHubAuthUrl(`${REDIRECT_URL}/globalsetting?from=github-auth`);
      window.location.href = oauthUrl;
      return;
    }
  };

  // 레포지토리 목록 가져오기
  useEffect(() => {
    if (isOpen && githubToken) {
      setIsLoading(true);
      setError('');

      // 직접 Next.js API 라우트 호출
      fetch('/api/github/user/repos', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`GitHub API 호출 실패: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setRepositories(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('레포지토리 목록 가져오기 실패:', error);
          setError('레포지토리를 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  }, [isOpen, githubToken]);

  // 레포지토리 선택 시 동작
  const handleRepoSelect = (repoId: string) => {
    const repo = repositories.find((r) => r.id === Number.parseInt(repoId));
    if (!repo) return;

    setSelectedRepo(repo);

    if (isArchitecture) {
      // 아키텍처 모드에서는 레포지토리만 선택하고 내부 탐색 없음
      // 이미 선택된 레포지토리인지 확인
      const isRepoSelected = selectedItems.some(
        (item) =>
          item.type === 'repository' && item.repoInfo?.owner === repo.owner.login && item.repoInfo?.name === repo.name
      );

      if (!isRepoSelected) {
        // 아키텍처 모드에서는 하나의 레포지토리만 선택 가능
        setSelectedItems([
          {
            path: `${repo.owner.login}/${repo.name}`,
            type: 'repository',
            repoInfo: {
              name: repo.name,
              owner: repo.owner.login,
            },
            content: '',
          },
        ]);
      } else {
        // 이미 선택된 경우 선택 취소
        setSelectedItems([]);
      }
    } else {
      // 일반 모드에서는 레포지토리 내부 탐색
      setCurrentPath('');
      setPathHistory([]);
      setIsLoading(true);
      setError('');

      if (!githubToken) {
        setError('GitHub 토큰이 없습니다.');
        setIsLoading(false);
        return;
      }

      // 직접 Next.js API 라우트 호출
      fetch(`/api/github/user/repos?action=contents&owner=${repo.owner.login}&repo=${repo.name}&path=`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`GitHub API 호출 실패: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setContents(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('컨텐츠 가져오기 실패:', error);
          setError('폴더 내용을 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  };

  // 폴더 열기
  const openFolder = (item: ContentItem) => {
    if (item.type === 'dir' && selectedRepo) {
      setPathHistory([...pathHistory, currentPath]);
      setIsLoading(true);
      setError('');

      if (!githubToken) {
        setError('GitHub 토큰이 없습니다.');
        setIsLoading(false);
        return;
      }

      // 직접 Next.js API 라우트 호출
      fetch(
        `/api/github/user/repos?action=contents&owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${item.path}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`GitHub API 호출 실패: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setContents(data);
          setCurrentPath(item.path);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('컨텐츠 가져오기 실패:', error);
          setError('폴더 내용을 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  };

  // 이전 폴더로 이동
  const goBack = () => {
    if (pathHistory.length > 0 && selectedRepo) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));

      setIsLoading(true);
      setError('');

      if (!githubToken) {
        setError('GitHub 토큰이 없습니다.');
        setIsLoading(false);
        return;
      }

      // 직접 Next.js API 라우트 호출
      fetch(
        `/api/github/user/repos?action=contents&owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&path=${previousPath}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`GitHub API 호출 실패: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setContents(data);
          setCurrentPath(previousPath);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('컨텐츠 가져오기 실패:', error);
          setError('폴더 내용을 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  };

  // 아이템 선택 여부 확인 함수
  const isItemSelected = (path: string) => {
    return selectedItems.some((item) => item.path === path);
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

    // 확장자가 없는 경우도 텍스트 파일로 간주 (README 등)
    if (!filename.includes('.')) return true;

    return textExtensions.some((ext) => filename.toLowerCase().endsWith(ext.toLowerCase()));
  };

  // 아키텍처 모드에서 전체 레포지토리 구조 가져오기
  const fetchFullRepositoryStructure = async () => {
    if (!selectedItems.length || !selectedItems[0].repoInfo || !githubToken) {
      setError('선택된 레포지토리가 없습니다.');
      return;
    }

    const repo = selectedItems[0].repoInfo;
    setIsLoadingFullRepo(true);
    setError('');

    try {
      // 1. 레포지토리 최신 커밋 SHA 가져오기 - 직접 API 호출
      const commitsResponse = await fetch(`/api/github/repos/${repo.owner}/${repo.name}/commits`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      });

      if (!commitsResponse.ok) {
        throw new Error(`커밋 정보 가져오기 실패: ${commitsResponse.status}`);
      }

      const commits = await commitsResponse.json();
      const latestSha = commits[0]?.sha;

      if (!latestSha) {
        throw new Error('커밋 정보를 찾을 수 없습니다');
      }

      // 2. 전체 레포지토리 트리 구조 가져오기 - 직접 API 호출
      const treeResponse = await fetch(
        `/api/github/repos/${repo.owner}/${repo.name}/git/trees/${latestSha}?recursive=1`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );

      if (!treeResponse.ok) {
        throw new Error(`트리 정보 가져오기 실패: ${treeResponse.status}`);
      }

      const treeData = await treeResponse.json();

      // 3. 선택된 항목 업데이트 - 원본 데이터 그대로 저장
      const newSelectedItem: SelectedItem = {
        path: `${repo.owner}/${repo.name}`,
        type: 'repository',
        repoInfo: repo,
        content: treeData,
      };

      setSelectedItems([newSelectedItem]);
    } catch (error) {
      console.error('레포지토리 전체 구조 가져오기 실패:', error);
      setError('레포지토리 전체 구조를 가져오는데 실패했습니다.');
    } finally {
      setIsLoadingFullRepo(false);
    }
  };

  // 아이템 선택 처리 함수 (파일과 폴더 모두 처리)
  const handleItemSelection = async (item: ContentItem) => {
    // 아키텍처 모드에서는 폴더/파일 선택 처리 안함 - 레포지토리만 선택 가능
    if (isArchitecture) {
      return;
    }

    // 이미 선택된 항목인지 확인
    const isSelected = isItemSelected(item.path);

    // 비텍스트 파일 선택하려는 경우 무시
    if (!isTextFile(item.name)) {
      return;
    }

    if (isSelected) {
      // 선택 해제
      setSelectedItems((items) => items.filter((i) => i.path !== item.path));
      // 오류 메시지가 있다면 제거
      setError('');
    } else {
      // 파일 선택 추가
      if (item.type === 'file' && item.download_url) {
        try {
          // 파일 내용 가져오기
          const response = await fetch(item.download_url);
          if (!response.ok) {
            throw new Error(`파일 내용 가져오기 실패: ${response.status}`);
          }

          const content = await response.text();

          setSelectedItems([
            ...selectedItems,
            {
              path: item.path,
              type: 'file',
              downloadUrl: item.download_url,
              content: content,
            },
          ]);
        } catch (error) {
          console.error('파일 내용 가져오기 실패:', error);
          setError('파일 내용을 가져오는데 실패했습니다.');
        }
      }
    }
  };

  // 파일 타입을 결정하는 함수 추가
  const determineFileType = (formType?: string): string => {
    switch (formType) {
      case 'codeConvention':
        return 'CONVENTION';
      case 'securitySetting':
        return 'SECURITY';
      case 'architectureStructure':
        return 'ARCHITECTURE_GITHUB';
      case 'requirementSpec':
        return 'REQUIREMENTS';
      case 'erd':
        return 'ERD';
      case 'utilityClass':
        return 'UTIL';
      case 'dependencyFile':
        return 'DEPENDENCY';
      case 'errorCode':
        return 'ERROR_CODE';
      default:
        return '';
    }
  };

  // 파일 선택 완료 처리 함수 수정
  const handleConfirm = async () => {
    if (selectedItems.length > 0) {
      try {
        // 아키텍처 모드에서 레포지토리가 선택된 경우 전체 구조 가져오기
        if (isArchitecture && selectedItems[0].type === 'repository') {
          if (!selectedItems[0].content) {
            await fetchFullRepositoryStructure();
          }

          if (selectedItems[0].content) {
            const processedData = [
              {
                path: selectedItems[0].path,
                content: selectedItems[0].content,
                fileType: 'ARCHITECTURE_GITHUB',
                fileName: selectedItems[0].path.split('/').pop() || '',
                isGitHub: true,
              },
            ];

            onSelect(processedData);
            onClose();
            return;
          } else {
            setError('레포지토리 구조를 가져오지 못했습니다.');
            return;
          }
        }

        // 일반 파일 모드
        const processedFiles = selectedItems.map((item) => {
          return {
            path: item.path,
            fileName: item.path.split('/').pop() || '',
            content: item.content,
            fileType: determineFileType(formType),
            isGitHub: true,
          };
        });

        onSelect(processedFiles);
        onClose();
      } catch (error) {
        console.error('파일 처리 중 오류 발생:', error);
        setError('파일 처리 중 오류가 발생했습니다.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className='bg-black/50 fixed inset-0 z-50 flex items-center justify-center'>
      <Card
        ref={modalRef}
        className='max-h-[80vh] flex flex-col w-full max-w-4xl overflow-hidden'
      >
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center'>
            <Github
              size={20}
              className='mr-2'
            />
            {isArchitecture ? 'GitHub에서 아키텍처 구조도 가져오기' : 'GitHub에서 파일 추가'}
          </CardTitle>
          <p className='text-muted-foreground text-sm'>
            {isArchitecture
              ? '아키텍처 구조도로 사용할 레포지토리를 선택한 후 확정 버튼을 클릭하세요'
              : '전역 설정에 추가할 파일을 선택하세요'}
          </p>
        </CardHeader>

        <CardContent className='space-y-4 overflow-auto'>
          <div className='flex space-x-2'>
            <Select
              onValueChange={handleRepoSelect}
              value={selectedRepo?.id?.toString() || ''}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='GitHub 레포지토리 선택' />
              </SelectTrigger>
              <SelectContent>
                {repositories.map((repo) => (
                  <SelectItem
                    key={repo.id}
                    value={repo.id.toString()}
                  >
                    {repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 아키텍처 모드일 때 선택된 레포지토리 표시 */}
          {isArchitecture && selectedItems.length > 0 && selectedItems[0].type === 'repository' && (
            <Card className='bg-blue-50 border-blue-200'>
              <CardContent className='p-4'>
                <h3 className='mb-2 font-medium'>선택된 레포지토리</h3>
                <div className='flex items-center'>
                  <Github
                    size={16}
                    className='mr-2 text-blue-600'
                  />
                  <span>{selectedItems[0].path}</span>
                </div>
                {selectedItems[0].content ? (
                  <div className='mt-2 text-sm text-green-600'>레포지토리 구조를 성공적으로 불러왔습니다.</div>
                ) : (
                  <div className='mt-2'>
                    <Button
                      size='sm'
                      onClick={fetchFullRepositoryStructure}
                      disabled={isLoadingFullRepo}
                      className='mt-2'
                    >
                      {isLoadingFullRepo ? '불러오는 중...' : '레포지토리 구조 불러오기'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 일반 모드일 때만 파일 탐색기 표시 */}
          {!isArchitecture && (
            <div className='max-h-[calc(100vh-400px)] flex flex-col flex-1'>
              {/* 파일 탐색기 헤더 */}
              {selectedRepo && (
                <div className='flex items-center p-2 mb-2 bg-gray-100 rounded'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={goBack}
                    disabled={pathHistory.length === 0}
                    className='p-1 mr-2'
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className='text-sm font-medium'>
                    {selectedRepo.name}
                    {currentPath ? ` / ${currentPath}` : ''}
                  </span>
                </div>
              )}

              {/* 파일 목록 영역 */}
              <div className='flex-1 min-h-0 mb-4 overflow-y-auto border rounded'>
                {isLoading ? (
                  <div className='flex items-center justify-center h-full'>
                    <p className='text-gray-500'>로딩 중...</p>
                  </div>
                ) : error ? (
                  <div className='flex items-center justify-center h-full p-4'>
                    <p className='text-red-500'>{error}</p>
                  </div>
                ) : !selectedRepo ? (
                  <div className='flex items-center justify-center h-full'>
                    <p className='text-gray-500'>레포지토리를 선택하세요.</p>
                  </div>
                ) : contents.length === 0 ? (
                  <div className='flex items-center justify-center h-full'>
                    <p className='text-gray-500'>이 폴더는 비어 있습니다.</p>
                  </div>
                ) : (
                  <ul className='divide-y'>
                    {contents.map((item) => (
                      <li
                        key={item.path}
                        className='hover:bg-gray-100 flex items-center p-3'
                      >
                        {/* 체크박스 */}
                        <div className='mr-2'>
                          <div
                            className={cn(
                              'w-5 h-5 rounded border flex items-center justify-center',
                              !isArchitecture && (item.type === 'dir' || !isTextFile(item.name))
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                : isItemSelected(item.path)
                                ? 'bg-blue-500 border-blue-500 cursor-pointer'
                                : 'border-gray-300 hover:border-blue-300 cursor-pointer'
                            )}
                            onClick={() => handleItemSelection(item)}
                          >
                            {isItemSelected(item.path) && (
                              <Check
                                size={12}
                                className='text-white'
                              />
                            )}
                          </div>
                        </div>

                        {/* 아이콘 및 이름 부분 */}
                        <div
                          className={cn(
                            'flex items-center flex-grow',
                            item.type === 'dir' || (!isArchitecture && isTextFile(item.name)) ? 'cursor-pointer' : ''
                          )}
                          onClick={() => {
                            if (item.type === 'dir') {
                              openFolder(item);
                            } else if (!isArchitecture && isTextFile(item.name)) {
                              handleItemSelection(item);
                            }
                          }}
                        >
                          {item.type === 'dir' ? (
                            <span className='mr-3 text-yellow-500'>
                              <Folder size={16} />
                            </span>
                          ) : (
                            <span className='mr-3 text-gray-500'>
                              <FileIcon size={16} />
                            </span>
                          )}
                          <span
                            className={cn(
                              item.type === 'dir' && 'underline',
                              !isArchitecture && isTextFile(item.name) && 'hover:text-blue-500'
                            )}
                          >
                            {item.name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 선택된 항목 목록 */}
              <div className='mb-4'>
                <p className='mb-2 text-sm font-medium'>선택된 항목: {selectedItems.length}개</p>
                {selectedItems.length > 0 && (
                  <div className='whitespace-nowrap p-2 overflow-x-auto text-sm border rounded'>
                    <div className='flex flex-wrap gap-2'>
                      {selectedItems.map((item, index) => (
                        <div
                          key={index}
                          className='inline-flex items-center px-3 py-1 text-gray-800 bg-gray-100 rounded-full'
                        >
                          <span className='max-w-[200px] truncate'>
                            {item.type === 'directory' ? `📁 ${item.path}` : item.path}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='hover:bg-gray-200 w-5 h-5 p-0 ml-1 rounded-full'
                            onClick={() => setSelectedItems((items) => items.filter((_, i) => i !== index))}
                          >
                            <X
                              size={12}
                              className='text-gray-500'
                            />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 에러 메시지 표시 */}
          {error && <div className='bg-red-50 p-2 text-sm text-red-600 border border-red-100 rounded'>{error}</div>}
        </CardContent>

        <CardFooter className='flex justify-end p-4 space-x-2 border-t'>
          <Button
            variant='outline'
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isArchitecture
                ? selectedItems.length === 0 || (isLoadingFullRepo && !selectedItems[0]?.content)
                : selectedItems.length === 0
            }
            variant='default'
          >
            {isArchitecture && isLoadingFullRepo ? '불러오는 중...' : '추가'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GitHubRepoBrowser;
