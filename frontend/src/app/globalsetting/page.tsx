'use client';

import useAuthStore from '@/app/store/useAuthStore';
import ContentArea from '@/components/globalsetting/ContentArea';
import Floatingbutton from '@/components/globalsetting/FloatingButton';
import LoadingOverlay from '@/components/globalsetting/LoadingOverlay';
import Sidebar from '@/components/globalsetting/Sidebar';
import GlobalHeader from '@/components/header/globalheader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGitHubTokenStore } from '@/store/githubTokenStore';
import { useProjectTempStore } from '@/store/projectTempStore';
import { AlertCircle, Menu } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

// 파일 객체 타입 정의
interface FileWithContent {
  name: string;
  content: string;
}

// 선택형 입력을 위한 타입 추가
interface SelectionValue {
  type: string; // enum 값
  label: string; // 표시 텍스트
}

// 설정 항목 키 타입 정의
type SettingKey =
  | 'title'
  | 'description'
  | 'serverUrl'
  | 'requirementSpec'
  | 'erd'
  | 'dependencyFile'
  | 'utilityClass'
  | 'errorCode'
  | 'securitySetting'
  | 'codeConvention'
  | 'architectureStructure';

// 프로젝트 설정 타입 정의
interface ProjectSettings {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileWithContent[];
  erd: FileWithContent[];
  dependencySelections: string[]; // 선택지용
  dependencyFiles: { name: string; content: string }[]; // 파일 첨부용
  dependencyFile: { name: string; content: string }[]; // <- 추가: 항상 최종 합쳐진 값
  utilityClass: FileWithContent[];
  errorCode: FileWithContent[];
  securitySetting: SelectionValue | FileWithContent[];
  codeConvention: FileWithContent[];
  architectureStructure: SelectionValue | FileWithContent[];
}

// 토큰 처리 컴포넌트
function TokenHandler() {
  const searchParams = useSearchParams();
  const { setGithubToken } = useGitHubTokenStore();

  // GitHub 토큰 확인
  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('github-token-direct');
    const { githubToken } = useGitHubTokenStore.getState();

    if (!githubToken && tokenFromStorage) {
      useGitHubTokenStore.getState().setGithubToken(tokenFromStorage);
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setGithubToken(token);
    }
  }, [searchParams, setGithubToken]);

  return null;
}

// 메인 컴포넌트
export default function GlobalSettingPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const { clearTempData } = useProjectTempStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 각 설정 항목의 상태를 관리 - 파일 관련 필드는 배열로 초기화
  const [settings, setSettings] = useState<ProjectSettings>({
    title: '',
    description: '',
    serverUrl: '',
    requirementSpec: [] as FileWithContent[],
    erd: [] as FileWithContent[],
    dependencySelections: [],
    dependencyFiles: [],
    dependencyFile: [],
    utilityClass: [] as FileWithContent[],
    errorCode: [] as FileWithContent[],
    securitySetting: { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
    codeConvention: [] as FileWithContent[],
    architectureStructure: { type: 'ARCHITECTURE_DEFAULT_LAYERED_A', label: '레이어드 아키텍처 A' },
  });

  // 각 설정 항목의 완료 상태를 관리
  const [completed, setCompleted] = useState<Record<SettingKey, boolean>>({
    title: false,
    description: false,
    serverUrl: false,
    requirementSpec: false,
    erd: false,
    utilityClass: false,
    errorCode: false,
    codeConvention: false,
    dependencyFile: true,
    securitySetting: true,
    architectureStructure: true,
  });

  // 현재 선택된 설정 항목
  const [activeItem, setActiveItem] = useState<SettingKey>('title');

  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  // 에러 메시지 관리
  const [error, setError] = useState<string | null>(null);

  // 각 설정 항목의 ref를 관리하여 스크롤 위치 조정에 사용
  const refs = {
    title: useRef<HTMLDivElement>(null),
    description: useRef<HTMLDivElement>(null),
    serverUrl: useRef<HTMLDivElement>(null),
    requirementSpec: useRef<HTMLDivElement>(null),
    erd: useRef<HTMLDivElement>(null),
    dependencyFile: useRef<HTMLDivElement>(null),
    utilityClass: useRef<HTMLDivElement>(null),
    errorCode: useRef<HTMLDivElement>(null),
    securitySetting: useRef<HTMLDivElement>(null),
    codeConvention: useRef<HTMLDivElement>(null),
    architectureStructure: useRef<HTMLDivElement>(null),
  };

  // architectureStructure 최신값을 위한 ref 선언
  const architectureStructureRef = useRef(settings.architectureStructure);

  // settings.architectureStructure가 바뀔 때마다 ref 갱신
  useEffect(() => {
    architectureStructureRef.current = settings.architectureStructure;
  }, [settings.architectureStructure]);

  // 스크롤 이벤트를 감지하여 현재 보이는 항목을 활성화
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // 약간의 오프셋 추가

      // 각 ref의 위치를 확인하여 현재 보이는 항목 결정
      let currentVisible: SettingKey = 'title';
      Object.entries(refs).forEach(([key, ref]) => {
        if (ref.current && ref.current.offsetTop <= scrollPosition) {
          currentVisible = key as SettingKey;
        }
      });

      setActiveItem(currentVisible);
    };

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 사이드바 항목 클릭 시 해당 설정 항목으로 스크롤
  const handleItemClick = (item: string) => {
    setActiveItem(item as SettingKey);
    refs[item as SettingKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // On mobile, close the sidebar after clicking an item
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // 타입 가드 함수들 추가
  function isSelectionValue(value: unknown): value is SelectionValue {
    return typeof value === 'object' && value !== null && 'type' in value && 'label' in value;
  }

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (
    key: string,
    value:
      | string
      | FileWithContent
      | FileWithContent[]
      | SelectionValue
      | { name: string; content: string }
      | { name: string; content: string }[]
      | string[]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      switch (key) {
        case 'dependencySelections':
          newSettings.dependencySelections = value as string[];
          break;
        case 'dependencyFiles':
          newSettings.dependencyFiles = value as { name: string; content: string }[];
          break;
        case 'title':
        case 'description':
        case 'serverUrl':
          if (typeof value === 'string') {
            newSettings[key] = value;
          }
          break;
        case 'securitySetting':
          if (Array.isArray(value)) {
            newSettings.securitySetting = value as FileWithContent[];
          } else if (isSelectionValue(value)) {
            newSettings.securitySetting = value;
          }
          break;
        case 'architectureStructure':
          if (isSelectionValue(value)) {
            newSettings.architectureStructure = value;
          } else if (Array.isArray(value)) {
            newSettings.architectureStructure = value as FileWithContent[];
          }
          break;
        case 'requirementSpec':
        case 'erd':
        case 'utilityClass':
        case 'codeConvention':
        case 'errorCode':
          if (Array.isArray(value)) {
            newSettings[key] = value as FileWithContent[];
          }
          break;
      }
      // 항상 dependencyFile을 최신화
      const depFiles = newSettings.dependencyFiles || [];
      let depSelections: { name: string; content: string }[] = [];
      if (newSettings.dependencySelections && newSettings.dependencySelections.length > 0) {
        depSelections = [
          {
            name: 'dependency.txt',
            content: newSettings.dependencySelections.join('\n'),
          },
        ];
      }
      newSettings.dependencyFile = [...depFiles, ...depSelections];
      return newSettings;
    });

    // 완료 상태 업데이트
    setCompleted((prev) => {
      const newCompleted = { ...prev };
      let isCompleted = false;

      switch (key) {
        case 'title':
        case 'description':
        case 'serverUrl':
          isCompleted = typeof value === 'string' && value.trim().length > 0;
          break;
        case 'securitySetting':
          if (Array.isArray(value)) {
            isCompleted = value.length > 0;
          } else if (isSelectionValue(value)) {
            isCompleted = value.type.startsWith('SECURITY_DEFAULT_');
          }
          break;
        case 'architectureStructure':
          if (isSelectionValue(value)) {
            isCompleted = value.type.startsWith('ARCHITECTURE_DEFAULT_');
          }
          break;
        case 'requirementSpec':
        case 'erd':
        case 'utilityClass':
        case 'errorCode':
        case 'codeConvention':
          if (Array.isArray(value)) {
            isCompleted = value.length > 0;
          }
          break;
      }

      newCompleted[key as SettingKey] = isCompleted;
      return newCompleted;
    });
  };

  // 필수 항목이 모두 완료되었는지 확인
  const isRequiredCompleted = () => {
    return (
      completed.title && completed.description && completed.serverUrl && completed.requirementSpec && completed.erd
    );
  };

  // 프로젝트 생성 버튼 클릭 핸들러
  const createProject = async () => {
    if (!token || !isAuthenticated) {
      setError('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // dependencyFile은 항상 최신 상태로 settings에 있음
      const payloadObj: Record<string, unknown> = {
        ...settings,
        architectureStructure: architectureStructureRef.current,
      };
      // 중복 방지: 서버로 보낼 때 불필요한 배열 제거
      delete payloadObj.dependencyFiles;
      delete payloadObj.dependencySelections;
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadObj),
      });

      // 응답 본문 로깅 (스트림은 한 번만 읽을 수 있으므로 복제)
      const responseClone = response.clone();
      const responseText = await responseClone.text();

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '프로젝트 생성 실패');
      }

      // 성공 시 임시 저장 데이터 초기화 후 메인 페이지로 이동
      clearTempData();
      router.push(`/project/${responseText}/api`);
    } catch (err) {
      console.error('프로젝트 생성 오류:', err);
      setError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지를 벗어날 때 임시 저장 데이터 초기화
  useEffect(() => {
    return () => {
      // GitHub 인증 관련 페이지로 이동하는 경우는 제외
      const isGithubAuth = window.location.href.includes('github');
      if (!isGithubAuth) {
        clearTempData();
      }
    };
  }, [clearTempData]);

  // setActiveItem 콜백 메모이제이션
  const handleSetActiveItem = useCallback((item: string) => {
    const key = item as SettingKey;
    setActiveItem(key);
    // 스크롤 실행
    refs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className='bg-gray-50 flex flex-col min-h-screen'>
      {/* 토큰 처리 컴포넌트를 Suspense로 감싸서 사용 */}
      <Suspense fallback={null}>
        <TokenHandler />
      </Suspense>

      <GlobalHeader />

      <div className='sm:px-4 sm:py-6 container flex-1 px-2 py-4 mx-auto'>
        {/* Mobile menu button */}
        <div className='md:hidden flex items-center mb-4'>
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
            onClick={toggleSidebar}
          >
            <Menu size={18} />
            <span>메뉴</span>
          </Button>
          <div className='ml-4 text-lg font-medium'>
            {/* Show current section name on mobile */}
            {activeItem === 'title' && '프로젝트명'}
            {activeItem === 'description' && '프로젝트 설명'}
            {activeItem === 'serverUrl' && 'Server URL'}
            {activeItem === 'requirementSpec' && '요구사항 명세서'}
            {activeItem === 'erd' && 'ERD'}
            {activeItem === 'dependencyFile' && '의존성 파일'}
            {activeItem === 'utilityClass' && '유틸 클래스'}
            {activeItem === 'errorCode' && '에러 코드'}
            {activeItem === 'codeConvention' && '코드 컨벤션'}
            {activeItem === 'securitySetting' && '보안 설정'}
            {activeItem === 'architectureStructure' && '아키텍처 구조'}
          </div>
        </div>

        <div className='h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex gap-4'>
          <Sidebar
            activeItem={activeItem}
            onItemClick={handleItemClick}
            completed={completed}
          />

          {/* Show sidebar on mobile when toggled */}
          {sidebarOpen && (
            <div
              className='md:hidden fixed inset-0 z-40 bg-black bg-opacity-50'
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <ContentArea
            settings={settings}
            onSettingChange={handleSettingChange}
            refs={refs}
            setActiveItem={handleSetActiveItem}
          />
        </div>

        {error && (
          <Alert
            variant='destructive'
            className='bottom-20 right-4 left-4 md:left-auto md:right-8 md:w-auto md:max-w-md animate-in slide-in-from-right fixed'
          >
            <AlertCircle className='w-4 h-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Floatingbutton
          isActive={isRequiredCompleted() && !isLoading}
          onClick={createProject}
          isLoading={isLoading}
        />
      </div>

      <LoadingOverlay isVisible={isLoading} />
    </div>
  );
}
