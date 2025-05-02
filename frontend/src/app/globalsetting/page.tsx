"use client"

import { useRef, useState, useEffect } from "react"
import Sidebar from "@/components/globalsetting/sidebar"
import ContentArea from "@/components/globalsetting/contentarea"
import Floatingbutton from "@/components/globalsetting/floatingbutton"

// 설정 항목 키 타입 정의
type SettingKey = 'title' | 'description' | 'serverUrl' | 'requirementSpec' | 'erd' | 
                 'dependencyFile' | 'utilityClass' | 'errorCode' | 'securitySetting' | 
                 'codeConvention' | 'architectureStructure';

export default function GlobalSettingPage() {
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

  return (
    <main className="p-4">
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
        <Floatingbutton isActive={isRequiredCompleted()} />
      </div>
    </main>
  )
}
