'use client';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useProjectTempStore } from '@/store/projectTempStore';
import {
  AlertCircle,
  Check,
  Database,
  File,
  FileText,
  Github,
  Globe,
  HardDrive,
  Layers,
  Loader2,
  Package,
  PenTool,
  Search,
  Server,
  Shield,
  Upload,
  X,
} from 'lucide-react';
import type React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import GitHubRepoBrowser from '../GitHubRepoBrowser';

interface FileData {
  name: string;
  content: string;
  isGitHub?: boolean;
}

interface SpringDependency {
  id: string;
  name: string;
  description: string;
  group?: string;
}

interface SpringMetadata {
  dependencies: {
    values: Array<{
      name: string;
      values: SpringDependency[];
    }>;
  };
  bootVersion: {
    default: string;
  };
  packagings: {
    values: Array<{
      id: string;
      name: string;
    }>;
  };
  javaVersions: {
    values: Array<{
      id: string;
      name: string;
    }>;
  };
  languages: {
    values: Array<{
      id: string;
      name: string;
    }>;
  };
  types: {
    values: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface DependencyFileFormProps {
  title: string;
  onFileSelect: (file: FileData) => void;
  onFocus?: () => void;
}

const DependencyFileForm = forwardRef<HTMLDivElement, DependencyFileFormProps>(
  ({ title, onFileSelect, onFocus }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [fileError, setFileError] = useState<string>('');
    const [springMetadata, setSpringMetadata] = useState<SpringMetadata | null>(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [metadataError, setMetadataError] = useState<string>('');
    const { tempData, setTempData } = useProjectTempStore();
    const [selectedDependencies, setSelectedDependencies] = useState<SpringDependency[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('spring');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const lastContentRef = useRef<string | null>(null);

    useEffect(() => {
      fetchSpringMetadata();
    }, []);

    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const isFromGithubAuth = params.get('from') === 'github-auth';
      const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

      if (isFromGithubAuth && isAuthPending && tempData.dependencyFile && tempData.dependencyFile.length > 0) {
        setSelectedFiles(tempData.dependencyFile as FileData[]);
        tempData.dependencyFile.forEach((file) => onFileSelect(file as FileData));
      }
    }, [tempData.dependencyFile, onFileSelect]);

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

    useEffect(() => {
      if (!springMetadata) return;

      const flatDependencies = springMetadata.dependencies.values.flatMap((group) => group.values);
      const savedDependencyIds = tempData.dependencySelections || [];

      const matchedDependencies = flatDependencies.filter((dep) => savedDependencyIds.includes(dep.id));

      if (matchedDependencies.length > 0) {
        setSelectedDependencies(matchedDependencies);
      } else {
        const defaultIds = ['web', 'lombok', 'devtools', 'data-jpa', 'mysql', 'validation'];
        const defaults = flatDependencies.filter((dep) => defaultIds.includes(dep.id));
        setSelectedDependencies(defaults);
        setTempData({ dependencySelections: defaults.map((d) => d.id) });
      }
    }, [springMetadata, setTempData, tempData.dependencySelections]);

    const fetchSpringMetadata = async () => {
      try {
        setLoadingMetadata(true);
        setMetadataError('');
        const response = await fetch('/api/spring/metadata');
        if (!response.ok) {
          throw new Error('메타데이터를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        console.log('Spring Initializr 메타데이터:', data);
        setSpringMetadata(data);
      } catch (error) {
        console.error('Spring 메타데이터 로드 오류:', error);
        setMetadataError('Spring Initializr 메타데이터를 가져오는데 실패했습니다.');
      } finally {
        setLoadingMetadata(false);
      }
    };

    // 카테고리별 필터링 또는 검색어 기반 필터링
    const getFilteredDependencies = () => {
      if (!springMetadata || !springMetadata.dependencies || !springMetadata.dependencies.values) return [];

      if (searchQuery) {
        return springMetadata.dependencies.values.flatMap((group) =>
          group.values
            .filter(
              (dep) =>
                dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (dep.id && dep.id.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map((dep) => ({ ...dep, group: group.name }))
        );
      }

      if (activeCategory) {
        const category = springMetadata.dependencies.values.find((cat) => cat.name === activeCategory);
        return category ? category.values.map((dep) => ({ ...dep, group: category.name })) : [];
      }

      return [];
    };

    const filteredDependencies = getFilteredDependencies();

    const toggleDependency = (dependency: SpringDependency) => {
      setSelectedDependencies((prev) => {
        const exists = prev.some((dep) => dep.id === dependency.id);
        if (exists) {
          return prev.filter((dep) => dep.id !== dependency.id);
        } else {
          return [...prev, dependency];
        }
      });
    };

    const isDependencySelected = (id: string) => {
      // Normalize the ID for comparison (remove version if present)
      const normalizeId = (depId: string) => depId.split(':').slice(0, 2).join(':');
      const normalizedId = normalizeId(id);

      return selectedDependencies.some((dep) => {
        const normalizedDepId = normalizeId(dep.id);
        return normalizedDepId === normalizedId;
      });
    };

    const handleGitHubFileSelect = (files: Array<{ path: string; content: string }>) => {
      if (files.length > 0) {
        const newFiles = files.map((file) => ({
          name: file.path,
          content: file.content,
          isGitHub: true,
        }));

        setSelectedFiles((prev) => [...prev, ...newFiles]);
        newFiles.forEach((file) => {
          onFileSelect(file);
        });
        setTempData({ dependencyFile: newFiles });
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
        const newFile = {
          name: file.name,
          content: content,
        };
        const newFiles = [...selectedFiles, newFile];
        setSelectedFiles(newFiles);
        onFileSelect(newFile);
        setTempData({ dependencyFile: newFiles });
      }
    };

    const handleFileUpload = () => {
      setDropdownOpen(false);
      document.getElementById(`file-upload-${title}`)?.click();
    };

    const handleGithubUpload = () => {
      setDropdownOpen(false);
      setIsGitHubModalOpen(true);
    };

    // 선택된 의존성이 변경될 때마다 파일로 변환하여 부모 컴포넌트에 전달
    useEffect(() => {
      if (selectedDependencies.length === 0) return;

      const newContent = selectedDependencies.map((dep) => `implementation '${dep.id}'`).join('\n');

      if (lastContentRef.current === newContent) return;
      lastContentRef.current = newContent;

      const dependencyFile = {
        name: 'build.gradle.dependencies',
        content: newContent,
      };

      // Save selected dependency IDs to tempData for persistence
      setTempData({
        dependencySelections: selectedDependencies.map((dep) => dep.id),
      });

      onFileSelect(dependencyFile);
    }, [selectedDependencies, onFileSelect, setTempData]);

    // 영어와 한글 카테고리 이름을 모두 지원하는 아이콘 맵
    const ICON_MAP: Record<string, React.ReactNode> = {
      // 영어 카테고리
      Web: <Globe className='w-5 h-5' />,
      SQL: <Database className='w-5 h-5' />,
      NoSQL: <Database className='w-5 h-5' />,
      Database: <Database className='w-5 h-5' />,
      Security: <Shield className='w-5 h-5' />,
      Cloud: <Server className='w-5 h-5' />,
      'Cloud Discovery': <Server className='w-5 h-5' />,
      'Cloud Config': <Server className='w-5 h-5' />,
      'Cloud Routing': <Server className='w-5 h-5' />,
      'Cloud Messaging': <Server className='w-5 h-5' />,
      'Developer Tools': <PenTool className='w-5 h-5' />,
      Observability: <PenTool className='w-5 h-5' />,
      Testing: <PenTool className='w-5 h-5' />,
      'I/O': <HardDrive className='w-5 h-5' />,
      'Template Engines': <FileText className='w-5 h-5' />,
      Messaging: <Package className='w-5 h-5' />,
      Core: <Package className='w-5 h-5' />,

      // 한글 카테고리
      웹: <Globe className='w-5 h-5' />,
      데이터베이스: <Database className='w-5 h-5' />,
      보안: <Shield className='w-5 h-5' />,
      클라우드: <Server className='w-5 h-5' />,
      개발도구: <PenTool className='w-5 h-5' />,
      '템플릿 엔진': <FileText className='w-5 h-5' />,
      입출력: <HardDrive className='w-5 h-5' />,
    };

    // 카테고리에 따른 색상 매핑
    const getCategoryColor = (category: string): string => {
      const colorMap: Record<string, string> = {
        // 영어 카테고리
        Web: 'bg-blue-100 text-blue-800',
        SQL: 'bg-green-100 text-green-800',
        NoSQL: 'bg-green-100 text-green-800',
        Database: 'bg-green-100 text-green-800',
        Security: 'bg-red-100 text-red-800',
        Cloud: 'bg-orange-100 text-orange-800',
        'Cloud Discovery': 'bg-orange-100 text-orange-800',
        'Cloud Config': 'bg-orange-100 text-orange-800',
        'Cloud Routing': 'bg-orange-100 text-orange-800',
        'Cloud Messaging': 'bg-orange-100 text-orange-800',
        'Developer Tools': 'bg-purple-100 text-purple-800',
        Observability: 'bg-purple-100 text-purple-800',
        Testing: 'bg-purple-100 text-purple-800',
        'I/O': 'bg-indigo-100 text-indigo-800',
        'Template Engines': 'bg-yellow-100 text-yellow-800',
        Messaging: 'bg-gray-100 text-gray-800',
        Core: 'bg-gray-100 text-gray-800',

        // 한글 카테고리
        웹: 'bg-blue-100 text-blue-800',
        데이터베이스: 'bg-green-100 text-green-800',
        보안: 'bg-red-100 text-red-800',
        클라우드: 'bg-orange-100 text-orange-800',
        개발도구: 'bg-purple-100 text-purple-800',
        '템플릿 엔진': 'bg-yellow-100 text-yellow-800',
        입출력: 'bg-indigo-100 text-indigo-800',
      };

      return colorMap[category] || 'bg-gray-100 text-gray-800';
    };

    // 카테고리에 따른 배경색 매핑
    const getCategoryBgColor = (category: string): string => {
      const bgColorMap: Record<string, string> = {
        // 영어 카테고리
        Web: 'bg-blue-50',
        SQL: 'bg-green-50',
        NoSQL: 'bg-green-50',
        Database: 'bg-green-50',
        Security: 'bg-red-50',
        Cloud: 'bg-orange-50',
        'Cloud Discovery': 'bg-orange-50',
        'Cloud Config': 'bg-orange-50',
        'Cloud Routing': 'bg-orange-50',
        'Cloud Messaging': 'bg-orange-50',
        'Developer Tools': 'bg-purple-50',
        Observability: 'bg-purple-50',
        Testing: 'bg-purple-50',
        'I/O': 'bg-indigo-50',
        'Template Engines': 'bg-yellow-50',
        Messaging: 'bg-gray-50',
        Core: 'bg-gray-50',

        // 한글 카테고리
        웹: 'bg-blue-50',
        데이터베이스: 'bg-green-50',
        보안: 'bg-red-50',
        클라우드: 'bg-orange-50',
        개발도구: 'bg-purple-50',
        '템플릿 엔진': 'bg-yellow-50',
        입출력: 'bg-indigo-50',
      };

      return bgColorMap[category] || 'bg-gray-50';
    };

    // 카테고리에 따른 테두리 색상 매핑
    const getCategoryBorderColor = (category: string): string => {
      const borderColorMap: Record<string, string> = {
        // 영어 카테고리
        Web: 'border-blue-200',
        SQL: 'border-green-200',
        NoSQL: 'border-green-200',
        Database: 'border-green-200',
        Security: 'border-red-200',
        Cloud: 'border-orange-200',
        'Cloud Discovery': 'border-orange-200',
        'Cloud Config': 'border-orange-200',
        'Cloud Routing': 'border-orange-200',
        'Cloud Messaging': 'border-orange-200',
        'Developer Tools': 'border-purple-200',
        Observability: 'border-purple-200',
        Testing: 'border-purple-200',
        'I/O': 'border-indigo-200',
        'Template Engines': 'border-yellow-200',
        Messaging: 'border-gray-200',
        Core: 'border-gray-200',

        // 한글 카테고리
        웹: 'border-blue-200',
        데이터베이스: 'border-green-200',
        보안: 'border-red-200',
        클라우드: 'border-orange-200',
        개발도구: 'border-purple-200',
        '템플릿 엔진': 'border-yellow-200',
        입출력: 'border-indigo-200',
      };

      return borderColorMap[category] || 'border-gray-200';
    };

    // 카테고리에 따른 아이콘 가져오기
    const getCategoryIcon = (category: string): React.ReactNode => {
      return ICON_MAP[category] || <Package className='w-5 h-5' />;
    };

    // 추천 의존성 목록 (요청한 6개만 포함)
    const RECOMMENDED_DEPENDENCY_NAMES = [
      'Spring Boot DevTools',
      'Lombok',
      'Spring Web',
      'Thymeleaf', // Template Engine
      'Spring Security',
      'MySQL Driver', // SQL
      'H2 Database', // SQL
      'Spring Data JPA', // SQL
      'Validation', // I/O
    ];

    // springMetadata로부터 동적 추천 리스트 구성
    const getRecommendedDependencies = (): {
      category: string;
      icon: React.ReactNode;
      color: string;
      bgColor: string;
      borderColor: string;
      items: SpringDependency[];
    }[] => {
      if (!springMetadata?.dependencies?.values) return [];

      return springMetadata.dependencies.values
        .map((group) => {
          const filteredItems = group.values.filter((dep) => RECOMMENDED_DEPENDENCY_NAMES.includes(dep.name));
          return {
            category: group.name,
            icon: getCategoryIcon(group.name),
            color: getCategoryColor(group.name),
            bgColor: getCategoryBgColor(group.name),
            borderColor: getCategoryBorderColor(group.name),
            items: filteredItems,
          };
        })
        .filter((group) => group.items.length > 0); // 의존성이 1개 이상인 그룹만 반환
    };

    // 카테고리 필터 토글 함수
    const toggleCategoryFilter = (category: string) => {
      if (activeCategory === category) {
        setActiveCategory(null); // 같은 카테고리를 다시 클릭하면 필터 해제
      } else {
        setActiveCategory(category);
      }
    };

    return (
      <div
        ref={ref}
        className='md:p-10 p-6 mb-8 bg-white rounded-lg'
      >
        <div className='flex flex-col mb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <h2 className='m-0 text-xl font-semibold'>{title}</h2>
            </div>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            프로젝트에서 사용할 외부 라이브러리와 프레임워크의 의존성 정보를 관리하는 파일입니다. (예: build.gradle,
            pom.xml)
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2 mb-4'>
            <TabsTrigger
              value='spring'
              className='flex items-center gap-2'
            >
              <Package size={16} />
              <span>Spring Initializr</span>
            </TabsTrigger>
            <TabsTrigger
              value='upload'
              className='flex items-center gap-2'
            >
              <Upload size={16} />
              <span>파일 업로드</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='upload'
            className='mt-0'
          >
            <div className='w-full'>
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
                  의존성 파일을 드래그해서 추가하거나
                  <br />
                  <span className='text-blue-500'>업로드하세요</span>
                </p>
                <div className='mt-2 text-xs text-gray-400'>
                  지원 파일 형식: 텍스트 기반 파일 (.txt, .md, .json, .xml, .html, .css, .js, .java, .py 등)
                </div>
              </div>

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
                        if (onFocus) onFocus();
                        handleGithubUpload();
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
                        if (onFocus) onFocus();
                        handleFileUpload();
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
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (!isTextFile(file.name)) {
                      setFileError('텍스트 형식의 파일만 추가할 수 있습니다.');
                      return;
                    }
                    setFileError('');
                    const content = await file.text();
                    const newFile = {
                      name: file.name,
                      content: content,
                    };
                    const newFiles = [...selectedFiles, newFile];
                    setSelectedFiles(newFiles);
                    onFileSelect(newFile);
                    setTempData({ dependencyFile: newFiles });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent
            value='spring'
            className='mt-0'
          >
            {loadingMetadata ? (
              <div className='flex flex-col items-center justify-center p-8'>
                <Loader2 className='animate-spin w-8 h-8 mb-4 text-blue-500' />
                <p className='text-sm text-gray-600'>Spring Initializr 메타데이터를 불러오는 중...</p>
              </div>
            ) : metadataError ? (
              <Alert
                variant='destructive'
                className='mb-4'
              >
                <AlertCircle className='w-4 h-4' />
                <span className='ml-2'>{metadataError}</span>
                <Button
                  variant='outline'
                  size='sm'
                  className='ml-auto'
                  onClick={fetchSpringMetadata}
                >
                  다시 시도
                </Button>
              </Alert>
            ) : springMetadata ? (
              <div className='space-y-4'>
                {/* 선택된 의존성 표시 영역 */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <label className='block text-sm font-medium'>선택된 의존성 ({selectedDependencies.length})</label>
                    {selectedDependencies.length > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedDependencies([])}
                        className='hover:text-red-700 text-xs text-red-500'
                      >
                        모두 지우기
                      </Button>
                    )}
                  </div>

                  <div className='min-h-[60px] bg-gray-50 flex flex-wrap gap-2 p-3 border rounded-md'>
                    {selectedDependencies.length === 0 ? (
                      <p className='w-full py-2 text-sm text-center text-gray-400'>선택된 의존성이 없습니다</p>
                    ) : (
                      selectedDependencies.map((dep) => (
                        <Badge
                          key={dep.id}
                          className='py-1.5 flex items-center gap-1 pl-3 pr-1 text-blue-800 bg-blue-100 border-blue-200'
                        >
                          <span className='text-xs font-medium'>{dep.name}</span>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='hover:bg-blue-200 w-5 h-5 p-0 ml-1 rounded-full'
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDependency(dep);
                            }}
                          >
                            <X
                              size={12}
                              className='text-blue-800'
                            />
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* 추천 의존성 카드 영역 */}
                <div className='space-y-3'>
                  <label className='block text-sm font-medium'>추천 의존성</label>
                  <div className='md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 gap-4'>
                    {getRecommendedDependencies().map((category) => (
                      <div
                        key={category.category}
                        className='hover:shadow-md overflow-hidden transition-all border rounded-lg shadow-sm'
                      >
                        <div className={`flex items-center gap-2 p-3 border-b ${category.bgColor}`}>
                          <div className={`p-1.5 rounded-md ${category.color}`}>{category.icon}</div>
                          <h3 className='text-sm font-medium'>{category.category}</h3>
                        </div>
                        <div className='p-2'>
                          {category.items.map((item) => {
                            const isSelected = isDependencySelected(item.id);
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'p-2.5 m-1 rounded-md cursor-pointer transition-all',
                                  isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-50'
                                )}
                                onClick={() => toggleDependency(item)}
                              >
                                <div className='flex items-center gap-2'>
                                  <div
                                    className={cn(
                                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                                      isSelected ? 'bg-blue-500' : 'border border-gray-300'
                                    )}
                                  >
                                    {isSelected && (
                                      <Check
                                        size={12}
                                        className='text-white'
                                      />
                                    )}
                                  </div>
                                  <span className='text-sm font-medium'>{item.name}</span>
                                </div>
                                <p className='line-clamp-2 pl-7 mt-1 text-xs text-gray-500'>{item.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 검색 및 카테고리 필터 영역 */}
                <div className='mt-6 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <label className='block text-sm font-medium'>의존성 검색 및 필터</label>
                    {activeCategory && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setActiveCategory(null)}
                        className='text-xs text-blue-500'
                      >
                        필터 초기화
                      </Button>
                    )}
                  </div>
                  <div className='relative'>
                    <Search
                      className='left-3 top-1/2 absolute text-gray-400 transform -translate-y-1/2'
                      size={16}
                    />
                    <Input
                      placeholder='의존성 검색...'
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value) setActiveCategory(null);
                      }}
                      className='pl-10 pr-10'
                    />
                    {searchQuery && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='right-2 top-1/2 hover:bg-gray-100 absolute w-6 h-6 p-0 transform -translate-y-1/2 rounded-full'
                        onClick={() => setSearchQuery('')}
                      >
                        <X
                          size={14}
                          className='text-gray-500'
                        />
                      </Button>
                    )}
                  </div>

                  {/* 카테고리 필터 버튼 */}
                  {!searchQuery && springMetadata.dependencies?.values && (
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {springMetadata.dependencies.values.map((category) => (
                        <Button
                          key={category.name}
                          variant={activeCategory === category.name ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => toggleCategoryFilter(category.name)}
                          className='text-xs'
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 의존성 목록 영역 */}
                <div className='border rounded-md'>
                  <div className='bg-gray-50 flex items-center justify-between p-3 border-b'>
                    <h3 className='text-sm font-medium'>
                      {searchQuery
                        ? `"${searchQuery}" 검색 결과`
                        : activeCategory
                        ? `${activeCategory} 카테고리`
                        : '카테고리 또는 검색어를 선택하세요'}
                    </h3>
                    <span className='text-xs text-gray-500'>
                      {filteredDependencies.length > 0 && `${filteredDependencies.length}개 항목`}
                    </span>
                  </div>
                  <ScrollArea className='h-[300px] overflow-y-auto'>
                    {(searchQuery || activeCategory) && filteredDependencies.length === 0 ? (
                      <div className='flex flex-col items-center justify-center p-8 text-center'>
                        <Search className='w-8 h-8 mb-2 text-gray-300' />
                        <p className='text-sm text-gray-500'>검색 결과가 없습니다</p>
                        <p className='mt-1 text-xs text-gray-400'>다른 검색어나 카테고리를 선택해보세요</p>
                      </div>
                    ) : searchQuery || activeCategory ? (
                      <div className='p-2 space-y-1'>
                        {filteredDependencies.map((dep) => {
                          const isSelected = isDependencySelected(dep.id);
                          return (
                            <div
                              key={dep.id}
                              className={cn(
                                'p-2.5 rounded-md cursor-pointer transition-all flex items-start gap-3',
                                isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                              )}
                              onClick={() => toggleDependency(dep)}
                            >
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                  isSelected ? 'bg-blue-500' : 'border border-gray-300'
                                )}
                              >
                                {isSelected && (
                                  <Check
                                    size={12}
                                    className='text-white'
                                  />
                                )}
                              </div>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-sm font-medium'>{dep.name}</span>
                                  {dep.group && (
                                    <Badge
                                      variant='outline'
                                      className='px-1.5 text-[10px] py-0 font-normal text-gray-500'
                                    >
                                      {dep.group}
                                    </Badge>
                                  )}
                                </div>
                                <p className='mt-1 text-xs text-gray-600'>{dep.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className='flex flex-col items-center justify-center p-8 text-center'>
                        <Layers className='w-8 h-8 mb-2 text-gray-300' />
                        <p className='text-sm text-gray-500'>카테고리를 선택하거나 검색어를 입력하세요</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {fileError && <div className='text-sm text-red-500'>{fileError}</div>}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center p-8'>
                <Button onClick={fetchSpringMetadata}>
                  <Package className='w-4 h-4 mr-2' />
                  Spring Initializr 메타데이터 불러오기
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

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
                      const newFiles = selectedFiles.filter((_, i) => i !== index);
                      setSelectedFiles(newFiles);
                      setTempData({ dependencyFile: newFiles });
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
        {selectedFiles.length > 0 && (
          <div className='mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                // 파일 페칭 확인 로직
                const fileNames = selectedFiles.map((file) => file.name).join(', ');
                alert(`다음 파일들이 성공적으로 로드되었습니다: ${fileNames}`);
              }}
              className='w-full'
            >
              <Check
                size={16}
                className='mr-2'
              />
              선택된 파일 확인
            </Button>
          </div>
        )}

        {/* GitHub 레포지토리 브라우저 모달 */}
        {isGitHubModalOpen && (
          <GitHubRepoBrowser
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            onSelect={handleGitHubFileSelect}
            formType='dependencyFile'
          />
        )}
      </div>
    );
  }
);

DependencyFileForm.displayName = 'DependencyFileForm';

export default DependencyFileForm;
