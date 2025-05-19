"use client"

import useAuthStore from "@/app/store/useAuthStore"
import ContentArea from "@/components/globalsetting/ContentArea"
import Floatingbutton from "@/components/globalsetting/FloatingButton"
import Sidebar from "@/components/globalsetting/Sidebar"
import { useGitHubTokenStore } from "@/store/githubTokenStore"
import { useProjectTempStore } from "@/store/projectTempStore"
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, useCallback } from "react"
import LoadingOverlay from "@/components/globalsetting/LoadingOverlay"
import GlobalHeader from "@/components/header/globalheader"

// 파일 객체 타입 정의
interface FileWithContent {
  name: string;
  content: string;
}

// 선택형 입력을 위한 타입 추가
interface SelectionValue {
  type: string;    // enum 값
  label: string;   // 표시 텍스트
}

// 설정 항목 키 타입 정의
type SettingKey = 'title' | 'description' | 'serverUrl' | 'requirementSpec' | 'erd' | 
                 'dependencyFile' | 'utilityClass' | 'errorCode' | 'securitySetting' | 
                 'codeConvention' | 'architectureStructure';

// 프로젝트 설정 타입 정의
interface ProjectSettings {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: FileWithContent[];
  erd: FileWithContent[];
  dependencyFile: { name: string; content: string }[];
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
    
    console.log('===== GitHub 토큰 확인 (전역 설정 페이지) =====');
    console.log('Zustand 토큰:', githubToken ? '존재함' : '없음');
    console.log('로컬스토리지 토큰:', tokenFromStorage ? '존재함' : '없음');
    
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
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const { clearTempData } = useProjectTempStore()
  
  // 각 설정 항목의 상태를 관리 - 파일 관련 필드는 배열로 초기화
  const [settings, setSettings] = useState<ProjectSettings>({
    title: "",
    description: "",
    serverUrl: "",
    requirementSpec: [] as FileWithContent[],
    erd: [] as FileWithContent[],
    dependencyFile: [] as { name: string; content: string }[],
    utilityClass: [] as FileWithContent[],
    errorCode: [] as FileWithContent[],
    securitySetting: { type: 'SECURITY_DEFAULT_JWT', label: 'JWT' },
    codeConvention: [] as FileWithContent[],
    architectureStructure: { type: "ARCHITECTURE_DEFAULT_LAYERED_A", label: "레이어드 아키텍처 A" },
  })

  // 각 설정 항목의 완료 상태를 관리
  const [completed, setCompleted] = useState<Record<SettingKey, boolean>>({
    title: false,
    description: false,
    serverUrl: false,
    requirementSpec: false,
    erd: false,
    dependencyFile: false,
    utilityClass: false,
    errorCode: false,
    securitySetting: false,
    codeConvention: false,
    architectureStructure: true,
  })

  // 현재 선택된 설정 항목
  const [activeItem, setActiveItem] = useState<SettingKey>("title")
  
  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false)
  // 에러 메시지 관리
  const [error, setError] = useState<string | null>(null)

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
  }

  // architectureStructure 최신값을 위한 ref 선언
  const architectureStructureRef = useRef(settings.architectureStructure);

  // settings.architectureStructure가 바뀔 때마다 ref 갱신
  useEffect(() => {
    architectureStructureRef.current = settings.architectureStructure;
  }, [settings.architectureStructure]);

  // 스크롤 이벤트를 감지하여 현재 보이는 항목을 활성화
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // 약간의 오프셋 추가

      // 각 ref의 위치를 확인하여 현재 보이는 항목 결정
      let currentVisible: SettingKey = "title"
      Object.entries(refs).forEach(([key, ref]) => {
        if (ref.current && ref.current.offsetTop <= scrollPosition) {
          currentVisible = key as SettingKey
        }
      })

      setActiveItem(currentVisible)
    }

    // 스크롤 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll)

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 사이드바 항목 클릭 시 해당 설정 항목으로 스크롤
  const handleItemClick = (item: string) => {
    setActiveItem(item as SettingKey)
    refs[item as SettingKey]?.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // 타입 가드 함수들 추가
  function isSelectionValue(value: unknown): value is SelectionValue {
    return typeof value === 'object' && value !== null && 'type' in value && 'label' in value;
  }

  function isFileWithContent(value: unknown): value is FileWithContent {
    return typeof value === 'object' && value !== null && 'name' in value && 'content' in value;
  }

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (key: string, value: string | FileWithContent | FileWithContent[] | SelectionValue | { name: string; content: string } | { name: string; content: string }[]) => {
    if (key === 'architectureStructure') {
      console.log('[GlobalSettingPage] handleSettingChange:', { key, value, type: typeof value, isArray: Array.isArray(value), valueContent: value });
    }
    setSettings((prev) => {
      const newSettings = { ...prev };
      
      switch(key) {
        case 'dependencyFile':
          if (Array.isArray(value)) {
            newSettings.dependencyFile = value as { name: string; content: string }[];
          } else if (isFileWithContent(value)) {
            newSettings.dependencyFile = [value];
          }
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
      
      return newSettings;
    });

    // 완료 상태 업데이트
    setCompleted((prev) => {
      const newCompleted = { ...prev };
      let isCompleted = false;

      switch(key) {
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
        case 'dependencyFile':
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
    return completed.title && completed.description && completed.serverUrl && completed.requirementSpec && completed.erd
  }
  
  // 프로젝트 생성 버튼 클릭 핸들러
  const createProject = async () => {
    if (!token || !isAuthenticated) {
      setError("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      return;
    }
    
    console.log('클라이언트에서 사용하는 토큰:', token);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 의존성 파일 로깅 추가
      console.log('=== 의존성 파일 전송 데이터 ===');
      console.log('의존성 파일 타입:', typeof settings.dependencyFile);
      console.log('의존성 파일 값:', settings.dependencyFile);
      // 아키텍처 구조 값 로깅 추가
      console.log('=== 아키텍처 구조 전송 데이터 ===');
      console.log('architectureStructure 타입:', typeof architectureStructureRef.current);
      console.log('architectureStructure 값:', architectureStructureRef.current);
      console.log('전송 직전 architectureStructure:', JSON.stringify(architectureStructureRef.current, null, 2));
      
      // Next.js API 라우트 호출
      console.log('API 라우트 호출 시작');
      const payload = {
        ...settings,
        architectureStructure: architectureStructureRef.current,
      };
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('함수 호출 함', `Bearer ${token}`);
      console.log('응답 상태:', response.status);
      
      // 응답 본문 로깅 (스트림은 한 번만 읽을 수 있으므로 복제)
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log('응답 본문:', responseText);
      
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
    refs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [refs]);

  return (
    <main className="h-[100vh] bg-blue-50">
      {/* 토큰 처리 컴포넌트를 Suspense로 감싸서 사용 */}
      <Suspense fallback={null}>
        <TokenHandler />
      </Suspense>
      
      <GlobalHeader />
      <div className="flex flex-col h-[90vh] w-full bg-blue-50">
        <div className="flex flex-1 overflow-hidden p-2">
          <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
          <ContentArea 
            settings={settings} 
            onSettingChange={handleSettingChange} 
            refs={refs}
            setActiveItem={handleSetActiveItem}
          />
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed bottom-20 right-8 z-50">
            {error}
          </div>
        )}
        <Floatingbutton isActive={isRequiredCompleted() && !isLoading} onClick={createProject} isLoading={isLoading} />
      </div>
      <LoadingOverlay isVisible={isLoading} />
    </main>
  )
}
