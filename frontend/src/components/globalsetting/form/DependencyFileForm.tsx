'use client';

import type React from 'react';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useProjectTempStore } from '@/store/projectTempStore';
import { AlertCircle, Check, Code, Database, File, Github, Loader2, Package, Search, Upload, X } from 'lucide-react';
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
    const [selectedDependencies, setSelectedDependencies] = useState<SpringDependency[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('upload');
    const [buildType, setBuildType] = useState<'gradle' | 'maven'>('gradle');
    const [javaVersion, setJavaVersion] = useState('17');
    const [bootVersion, setBootVersion] = useState('');
    const [packaging, setPackaging] = useState('jar');
    const [language, setLanguage] = useState('java');
    const [projectType, setProjectType] = useState('maven-project');
    const [generatingFile, setGeneratingFile] = useState(false);

    const { tempData, setTempData } = useProjectTempStore();

    // GitHub 인증 후 리다이렉트인 경우에만 임시저장 데이터 불러오기
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const isFromGithubAuth = params.get('from') === 'github-auth';
      const isAuthPending = localStorage.getItem('github-auth-pending') === 'true';

      if (isFromGithubAuth && isAuthPending && tempData.dependencyFile.length > 0) {
        // 한 번에 상태 업데이트
        setSelectedFiles(tempData.dependencyFile as FileData[]);
        // 각 파일에 대해 한 번만 onFileSelect 호출
        tempData.dependencyFile.forEach((file) => onFileSelect(file as FileData));
      }
    }, []);

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

    // Spring Initializr 메타데이터 가져오기
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
        setBootVersion(data.bootVersion.default);
      } catch (error) {
        console.error('Spring 메타데이터 로드 오류:', error);
        setMetadataError('Spring Initializr 메타데이터를 가져오는데 실패했습니다.');
      } finally {
        setLoadingMetadata(false);
      }
    };

    // 의존성 검색 및 필터링
    const filteredDependencies =
      springMetadata?.dependencies.values.flatMap((group) =>
        group.values
          .filter(
            (dep) =>
              dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              dep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (dep.id && dep.id.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((dep) => ({ ...dep, group: group.name }))
      ) || [];

    // 의존성 선택 토글
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

    // 선택된 의존성인지 확인
    const isDependencySelected = (id: string) => {
      return selectedDependencies.some((dep) => dep.id === id);
    };

    // build.gradle 파일 생성
    const generateGradleBuild = () => {
      const deps = selectedDependencies.map((dep) => `\timplementation '${dep.id}'`).join('\n');

      return `plugins {
  id 'org.springframework.boot' version '${bootVersion}'
  id 'io.spring.dependency-management' version '1.1.4'
  id 'java'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
  sourceCompatibility = '${javaVersion}'
}

repositories {
  mavenCentral()
}

dependencies {
${deps}
}

tasks.named('test') {
  useJUnitPlatform()
}`;
    };

    // pom.xml 파일 생성
    const generateMavenPom = () => {
      const deps = selectedDependencies
        .map((dep) => {
          const [group, artifact] = dep.id.split(':');
          return `\t\t<dependency>
\t\t\t<groupId>${group}</groupId>
\t\t\t<artifactId>${artifact}</artifactId>
\t\t</dependency>`;
        })
        .join('\n');

      return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${bootVersion}</version>
    <relativePath/> <!-- lookup parent from repository -->
  </parent>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>demo</name>
  <description>Demo project for Spring Boot</description>
  <properties>
    <java.version>${javaVersion}</java.version>
  </properties>
  <dependencies>
${deps}
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>`;
    };

    // 의존성 파일 생성 및 추가
    const generateDependencyFile = () => {
      if (selectedDependencies.length === 0) {
        setFileError('최소 하나 이상의 의존성을 선택해주세요.');
        return;
      }

      setGeneratingFile(true);
      try {
        const fileName = buildType === 'gradle' ? 'build.gradle' : 'pom.xml';
        const content = buildType === 'gradle' ? generateGradleBuild() : generateMavenPom();

        const newFile = {
          name: fileName,
          content: content,
        };

        const newFiles = [...selectedFiles, newFile];
        setSelectedFiles(newFiles);
        onFileSelect(newFile);
        setTempData({ dependencyFile: newFiles });
        setFileError('');
        setActiveTab('upload'); // 파일 생성 후 업로드 탭으로 전환
      } catch (error) {
        console.error('의존성 파일 생성 오류:', error);
        setFileError('의존성 파일을 생성하는데 실패했습니다.');
      } finally {
        setGeneratingFile(false);
      }
    };

    // GitHub에서 파일 선택 시 호출될 핸들러
    const handleGitHubFileSelect = (files: Array<{ path: string; content: string }>) => {
      if (files.length > 0) {
        // 각 파일을 개별적으로 처리
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
              value='upload'
              className='flex items-center gap-2'
            >
              <Upload size={16} />
              <span>파일 업로드</span>
            </TabsTrigger>
            <TabsTrigger
              value='spring'
              className='flex items-center gap-2'
              onClick={() => {
                if (!springMetadata && !loadingMetadata) {
                  fetchSpringMetadata();
                }
              }}
            >
              <Package size={16} />
              <span>Spring Initializr</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='upload'
            className='mt-0'
          >
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
                  의존성 파일을 드래그해서 추가하거나
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
                <div className='md:grid-cols-2 grid grid-cols-1 gap-4'>
                  <div>
                    <label className='block mb-1 text-sm font-medium'>빌드 도구</label>
                    <div className='flex space-x-2'>
                      <Button
                        variant={buildType === 'gradle' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setBuildType('gradle')}
                        className='flex items-center gap-1'
                      >
                        <Code size={14} />
                        Gradle
                      </Button>
                      <Button
                        variant={buildType === 'maven' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setBuildType('maven')}
                        className='flex items-center gap-1'
                      >
                        <Code size={14} />
                        Maven
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className='block mb-1 text-sm font-medium'>Java 버전</label>
                    <select
                      className='w-full p-2 border rounded-md'
                      value={javaVersion}
                      onChange={(e) => setJavaVersion(e.target.value)}
                    >
                      {springMetadata.javaVersions.values.map((version) => (
                        <option
                          key={version.id}
                          value={version.id}
                        >
                          {version.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium'>의존성 검색</label>
                  <div className='relative'>
                    <Search
                      className='left-3 top-1/2 absolute text-gray-400 transform -translate-y-1/2'
                      size={16}
                    />
                    <Input
                      placeholder='의존성 검색...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

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

                  <div className='min-h-[60px] bg-gray-50 flex flex-wrap gap-2 p-2 border rounded-md'>
                    {selectedDependencies.length === 0 ? (
                      <p className='w-full py-2 text-sm text-center text-gray-400'>선택된 의존성이 없습니다</p>
                    ) : (
                      selectedDependencies.map((dep) => (
                        <Badge
                          key={dep.id}
                          className='hover:bg-blue-200 flex items-center gap-1 px-2 py-1 text-blue-800 bg-blue-100'
                        >
                          <span className='text-xs'>{dep.name}</span>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='hover:bg-blue-200 w-4 h-4 p-0 ml-1 rounded-full'
                            onClick={() => toggleDependency(dep)}
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

                <div className='border rounded-md'>
                  <div className='bg-gray-50 p-3 border-b'>
                    <h3 className='text-sm font-medium'>사용 가능한 의존성</h3>
                  </div>
                  <ScrollArea className='h-[300px] p-2 overflow-y-auto'>
                    {searchQuery && filteredDependencies.length === 0 ? (
                      <p className='p-4 text-sm text-center text-gray-500'>검색 결과가 없습니다</p>
                    ) : (
                      <div className='space-y-1'>
                        {filteredDependencies.map((dep) => (
                          <div
                            key={dep.id}
                            className={cn(
                              'p-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-start gap-2',
                              isDependencySelected(dep.id) && 'bg-blue-50 hover:bg-blue-100'
                            )}
                            onClick={() => toggleDependency(dep)}
                          >
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5',
                                isDependencySelected(dep.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              )}
                            >
                              {isDependencySelected(dep.id) && (
                                <Check
                                  size={12}
                                  className='text-white'
                                />
                              )}
                            </div>
                            <div>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-medium'>{dep.name}</span>
                                <span className='text-xs text-gray-500'>{dep.group}</span>
                              </div>
                              <p className='mt-0.5 text-xs text-gray-600'>{dep.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {fileError && <div className='text-sm text-red-500'>{fileError}</div>}

                <Button
                  className='w-full'
                  onClick={generateDependencyFile}
                  disabled={selectedDependencies.length === 0 || generatingFile}
                >
                  {generatingFile ? (
                    <>
                      <Loader2 className='animate-spin w-4 h-4 mr-2' />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Database className='w-4 h-4 mr-2' />
                      {buildType === 'gradle' ? 'build.gradle' : 'pom.xml'} 생성하기
                    </>
                  )}
                </Button>
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
                      // 파일 삭제 시 빈 content로 전달하지 않고 삭제된 상태만 반영
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
