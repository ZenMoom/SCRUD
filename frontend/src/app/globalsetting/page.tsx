"use client"

import { useRef, useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from "@/components/globalsetting/Sidebar"
import ContentArea from "@/components/globalsetting/ContentArea"
import Floatingbutton from "@/components/globalsetting/FloatingButton"
import axios from "axios"
import { useGitHubTokenStore } from "@/store/githubTokenStore"

// 설정 항목 키 타입 정의
type SettingKey = 'title' | 'description' | 'serverUrl' | 'requirementSpec' | 'erd' | 
                 'dependencyFile' | 'utilityClass' | 'errorCode' | 'securitySetting' | 
                 'codeConvention' | 'architectureStructure';

// 파일 타입을 백엔드 API의 FileTypeEnumDto와 매핑
const fileTypeMapping: Record<string, string> = {
  'requirementSpec': 'REQUIREMENTS',
  'erd': 'ERD',
  'utilityClass': 'UTIL',
  'codeConvention': 'CONVENTION',
  'dependencyFile': 'DEPENDENCY',
  'errorCode': 'ERROR_CODE',
  'securitySetting': 'SECURITY',
  'architectureStructure': 'ARCHITECTURE_DEFAULT'
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
  
  // 각 설정 항목의 상태를 관리 - 초기값은 빈 문자열로 설정
  const [settings, setSettings] = useState({
    title: "",
    description: "",
    serverUrl: "",
    requirementSpec: "",
    erd: "",
    dependencyFile: "",
    utilityClass: "",
    errorCode: "",
    securitySetting: "jwt", // 첫 번째 선택지를 기본값으로 설정
    codeConvention: "",
    architectureStructure: "layered", // 첫 번째 선택지를 기본값으로 설정
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
  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    // 값이 있으면 완료 상태로 변경
    if (value && value.trim() !== "") {
      setCompleted((prev) => ({ ...prev, [key as SettingKey]: true }))
    } else {
      setCompleted((prev) => ({ ...prev, [key as SettingKey]: false }))
    }
  }

  // 필수 항목이 모두 완료되었는지 확인
  const isRequiredCompleted = () => {
    return completed.title && completed.description && completed.requirementSpec && completed.erd
  }
  
  // 프로젝트 생성 API 호출
  const createProject = async () => {
    if (!isRequiredCompleted()) {
      setError("필수 항목을 모두 입력해주세요.")
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // API 요청 데이터 준비
      const globalFiles = []
      
      // 파일 타입 항목들 추가
      Object.entries(settings).forEach(([key, value]) => {
        if (fileTypeMapping[key] && value) {
          globalFiles.push({
            fileName: value,
            fileType: fileTypeMapping[key],
            fileUrl: "",
            fileContent: JSON.stringify({ content: value })
          })
        }
      })
      
      // 아키텍처 구조 추가 (사용자 선택)
      globalFiles.push({
        fileName: `Architecture-${settings.architectureStructure}`,
        fileType: "ARCHITECTURE_DEFAULT",
        fileUrl: "",
        fileContent: JSON.stringify({ type: settings.architectureStructure })
      })
      
      // 보안 설정 추가
      globalFiles.push({
        fileName: `Security-${settings.securitySetting}`,
        fileType: "SECURITY",
        fileUrl: "",
        fileContent: JSON.stringify({ type: settings.securitySetting })
      })
      
      const projectData = {
        scrudProjectDto: {
          title: settings.title,
          description: settings.description,
          serverUrl: settings.serverUrl
        },
        globalFiles: globalFiles
      }
      
      // API 호출
      const response = await axios.post('/api/projects', projectData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhY2Nlc3NUb2tlbiIsInVzZXJuYW1lIjoidmphd2IyMjYyQGdtYWlsLmNvbSIsImlkIjoiNzI0MDhkZmEtM2EzYy00YjE0LTg1MzAtYjUyZmVlMzhjMmZmIiwiaWF0IjoxNzQ2NjY5MzQ3LCJleHAiOjE3NDY2NzUzNDd9.mXIm7RYlyxjCuwU1rggcHXgfQPhMBYUutKCIn-QE6lI'
        }
      })
      
      console.log('프로젝트 생성 성공:', response.data)
      
      // 프로젝트 생성 성공 후 메인 페이지로 이동
      router.push('/')
    } catch (err) {
      console.error('프로젝트 생성 오류:', err)
      setError('프로젝트 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

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
