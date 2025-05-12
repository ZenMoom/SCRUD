import React, { useState, useEffect } from 'react';
import { useGitHubTokenStore } from '@/store/githubTokenStore';
import { Folder, File as FileIcon, Github, ChevronLeft } from 'lucide-react';
import { 
  fetchRepositories, 
  fetchContents, 
  toggleFileSelection 
} from '@/lib/api/github';

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
  onSelect: (files: {path: string, downloadUrl?: string}[]) => void;
}

const GitHubRepoBrowser: React.FC<GitHubRepoBrowserProps> = ({ isOpen, onClose, onSelect }) => {
  const { githubToken } = useGitHubTokenStore();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ path: string; content: string }[]>([]);
  const [error, setError] = useState<string>('');

  // 레포지토리 목록 가져오기
  useEffect(() => {
    if (isOpen && githubToken) {
      setIsLoading(true);
      setError('');
      
      fetchRepositories(githubToken)
        .then(data => {
          setRepositories(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('레포지토리 목록 가져오기 실패:', error);
          setError('레포지토리를 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  }, [isOpen, githubToken]);

  // 레포지토리 선택 시 콘텐츠 가져오기
  const handleRepoSelect = (repo: Repository) => {
    setSelectedRepo(repo);
    setCurrentPath('');
    setPathHistory([]);
    
    setIsLoading(true);
    setError('');
    
    if (!githubToken) {
      setError('GitHub 토큰이 없습니다.');
      setIsLoading(false);
      return;
    }
    
    fetchContents(githubToken, repo.owner.login, repo.name, '')
      .then(data => {
        setContents(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('컨텐츠 가져오기 실패:', error);
        setError('폴더 내용을 불러오는데 실패했습니다.');
        setIsLoading(false);
      });
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
      
      fetchContents(githubToken, selectedRepo.owner.login, selectedRepo.name, item.path)
        .then(data => {
          setContents(data);
          setCurrentPath(item.path);
          setIsLoading(false);
        })
        .catch(error => {
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
      
      fetchContents(githubToken, selectedRepo.owner.login, selectedRepo.name, previousPath)
        .then(data => {
          setContents(data);
          setCurrentPath(previousPath);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('컨텐츠 가져오기 실패:', error);
          setError('폴더 내용을 불러오는데 실패했습니다.');
          setIsLoading(false);
        });
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (item: ContentItem) => {
    if (item.type === 'file' && item.download_url) {
      // 이미 선택된 파일인지 확인
      const existingIndex = selectedFiles.findIndex(file => file.path === item.path);
      const isSelected = existingIndex !== -1;
      
      if (!githubToken) {
        setError('GitHub 토큰이 없습니다.');
        return;
      }
      
      toggleFileSelection(githubToken, item.download_url, item.path, isSelected)
        .then(response => {
          if (response.selected) {
            // 새 파일 추가
            setSelectedFiles([...selectedFiles, {
              path: response.path,
              content: response.content
            }]);
          } else {
            // 기존 파일 제거
            setSelectedFiles(selectedFiles.filter((_, index) => index !== existingIndex));
          }
        })
        .catch(error => {
          console.error('파일 선택 처리 실패:', error);
          setError('파일 처리에 실패했습니다.');
        });
    }
  };

  // 파일 선택 완료
  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      // 모든 선택된 파일의 경로와 다운로드 URL 준비
      const filesWithUrls = selectedFiles.map(file => {
        // 각 파일에 대한 download_url 찾기
        const selectedItem = contents.find(item => item.path === file.path);
        return {
          path: file.path,
          downloadUrl: selectedItem?.download_url
        };
      });

      // 모든 파일 정보 전달
      onSelect(filesWithUrls);
    }
    onClose();
  };

  // 파일이 선택되었는지 확인
  const isFileSelected = (item: ContentItem) => {
    return selectedFiles.some(file => file.path === item.path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-md p-10 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 ">
          <h2 className="text-lg font-semibold flex items-center ">
            <span className="mr-2"><Github size={20} /></span> GitHub에서 파일 추가
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          전역 설정에 추가할 파일을 선택하세요
        </p>
        
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative">
            <select
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              onChange={(e) => {
                const repo = repositories.find(r => r.id === parseInt(e.target.value));
                if (repo) handleRepoSelect(repo);
              }}
              value={selectedRepo?.id || ''}
            >
              <option value="">GitHub 레포지토리 선택</option>
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id}>{repo.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* 파일 탐색기 헤더 */}
        {selectedRepo && (
          <div className="flex items-center bg-gray-100 p-2 rounded mb-2">
            <button
              onClick={goBack}
              disabled={pathHistory.length === 0}
              className={`p-1 rounded mr-2 ${pathHistory.length === 0 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <span><ChevronLeft size={16} /></span>
            </button>
            <span className="text-sm font-medium">
              {selectedRepo.name}{currentPath ? ` / ${currentPath}` : ''}
            </span>
          </div>
        )}
        
        {/* 파일 목록 영역 */}
        <div className="flex-1 overflow-y-auto border rounded mb-4 min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : !selectedRepo ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">레포지토리를 선택하세요.</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">이 폴더는 비어 있습니다.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {contents.map((item) => (
                <li
                  key={item.path}
                  onClick={() => item.type === 'dir' ? openFolder(item) : handleFileSelect(item)}
                  className={`p-3 flex items-center hover:bg-gray-100 cursor-pointer ${
                    isFileSelected(item) ? 'bg-blue-50' : ''
                  }`}
                >
                  {item.type === 'dir' ? (
                    <span className="text-yellow-500 mr-3"><Folder size={16} /></span>
                  ) : (
                    <span className="text-gray-500 mr-3"><FileIcon size={16} /></span>
                  )}
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* 선택된 파일 목록 */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">선택된 파일: {selectedFiles.length}개</p>
          {selectedFiles.length > 0 && (
            <ul className="text-sm max-h-[100px] overflow-y-auto border p-2 rounded">
              {selectedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between py-1">
                  <span className="truncate">{file.path}</span>
                  <button
                    onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedFiles.length === 0}
            className={`px-4 py-2 rounded text-white ${
              selectedFiles.length === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubRepoBrowser; 