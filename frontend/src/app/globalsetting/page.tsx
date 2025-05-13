"use client"

import { useRef, useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from "@/components/globalsetting/Sidebar"
import ContentArea from "@/components/globalsetting/ContentArea"
import Floatingbutton from "@/components/globalsetting/FloatingButton"
import { useGitHubTokenStore } from "@/store/githubTokenStore"
import useAuthStore from "@/app/store/useAuthStore"

// 파일 객체 타입 정의
interface FileWithContent {
  name: string;
  content: string;
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
  requirementSpec: string[];
  erd: string[];
  dependencyFile: string[];
  utilityClass: string[];
  errorCode: FileWithContent[];
  securitySetting: string;
  codeConvention: string[];
  architectureStructure: string;
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
  // AuthStore에서 토큰과 인증 상태 가져오기
  const { token, isAuthenticated } = useAuthStore()
  
  // 각 설정 항목의 상태를 관리 - 파일 관련 필드는 배열로 초기화
  const [settings, setSettings] = useState<ProjectSettings>({
    title: "",
    description: "",
    serverUrl: "",
    requirementSpec: [] as string[],
    erd: [] as string[],
    dependencyFile: [] as string[],
    utilityClass: [] as string[],
    errorCode: [] as FileWithContent[],
    securitySetting: "SECURITY_DEFAULT_JWT", // 첫 번째 선택지를 기본값으로 설정
    codeConvention: [] as string[],
    architectureStructure: "ARCHITECTURE_DEFAULT_LAYERED_A", // 첫 번째 선택지를 기본값으로 설정
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
    securitySetting: true, // 기본값이 설정되어 있으므로 true로 설정
    codeConvention: false,
    architectureStructure: true, // 기본값이 설정되어 있으므로 true로 설정
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

  // 설정 항목 값 변경 시 상태 업데이트
  const handleSettingChange = (key: string, value: string | string[] | FileWithContent | FileWithContent[]) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      
      // 타입 가드를 사용하여 각 키에 맞는 값 할당
      switch(key) {
        case 'errorCode':
          newSettings.errorCode = value as FileWithContent[];
          break;
        case 'title':
        case 'description':
        case 'serverUrl':
        case 'securitySetting':
        case 'architectureStructure':
          newSettings[key] = value as string;
          break;
        case 'requirementSpec':
        case 'erd':
        case 'dependencyFile':
        case 'utilityClass':
        case 'codeConvention':
          newSettings[key] = value as string[];
          break;
      }
      
      return newSettings;
    });

    // 값이 있으면 완료 상태로 변경
    if (
      (typeof value === 'string' && value.trim() !== "") ||
      (Array.isArray(value) && value.length > 0) ||
      (value && typeof value === 'object' && 'name' in value) ||  // FileWithContent 객체인 경우
      (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'name' in value[0])  // FileWithContent 배열인 경우
    ) {
      setCompleted((prev) => ({ ...prev, [key as SettingKey]: true }))
    } else {
      setCompleted((prev) => ({ ...prev, [key as SettingKey]: false }))
    }
  }

  // 필수 항목이 모두 완료되었는지 확인
  const isRequiredCompleted = () => {
    return completed.title && completed.description && completed.serverUrl && completed.requirementSpec && completed.erd
  }
  
  // 프로젝트 생성 버튼 클릭 핸들러
  const createProject = async () => {
    // 인증 토큰 확인
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
      // Next.js API 라우트 호출
      console.log('API 라우트 호출 시작');
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Bearer 접두어 추가
        },
        body: JSON.stringify(settings)
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
      
      // 성공 시 메인 페이지로 이동
      router.push(`/project/${responseText}/api`);
    } catch (err) {
      console.error('프로젝트 생성 오류:', err);
      setError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4">
      {/* 토큰 처리 컴포넌트를 Suspense로 감싸서 사용 */}
      <Suspense fallback={null}>
        <TokenHandler />
      </Suspense>
      
      <h1 className="text-2xl font-bold mb-6">SCRUD</h1>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-1/3 text-center relative">
            <div className="w-full absolute top-1/2 h-1 bg-gray-300 -z-10"></div>
            <span className="bg-blue-500 text-white px-4 py-2 rounded-full">전역 설정</span>
          </div>
          <div className="w-1/3 text-center relative">
            <div className="w-full absolute top-1/2 h-1 bg-gray-300 -z-10"></div>
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full">API 제작</span>
          </div>
          <div className="w-1/3 text-center relative">
            <div className="absolute top-1/2 h-1 bg-gray-300 -z-10 w-full"></div>
            <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full">API 도식화</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-[90vh] w-full bg-[#fafafa]">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar completed={completed} activeItem={activeItem} onItemClick={handleItemClick} />
          <ContentArea 
            settings={settings} 
            onSettingChange={handleSettingChange} 
            refs={refs}
            setActiveItem={(item: string) => setActiveItem(item as SettingKey)}
          />
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed bottom-20 right-8 z-50">
            {error}
          </div>
        )}
        <Floatingbutton isActive={isRequiredCompleted() && !isLoading} onClick={createProject} isLoading={isLoading} />
      </div>
    </main>
  )
}
