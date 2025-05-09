"use client"

import ApiCreator from "@/components/api-creator/ApiCreator"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"

// 프로젝트 정보 인터페이스
interface ProjectInfo {
  id: number
  title: string
  description?: string
}

export default function ProjectApiPage() {
  const params = useParams()
  const router = useRouter()
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 문자열 ID를 숫자로 변환
  const projectId = params.id ? parseInt(params.id as string, 10) : 0

  // 프로젝트 정보 로드
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId || isNaN(projectId)) {
        setError("유효하지 않은 프로젝트 ID입니다")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // 프로젝트 정보를 가져오는 API 호출
        // 실제 프로젝트 API가 있다면 그것을 사용하고, 없다면 기본값 설정
        // const response = await axios.get(`/api/projects/${projectId}`);
        // setProjectInfo(response.data);

        // API가 없는 경우 임시 데이터 설정 (실제 구현 시 이 부분을 API 호출로 대체)
        setProjectInfo({
          id: projectId,
          title: `프로젝트 ${projectId}`,
        })

        // API 스펙이 존재하는지 확인 (404 에러를 방지하기 위함)
        // 선택적으로 추가할 수 있는 코드
        try {
          await axios.get(`/api/api-specs/by-project/${projectId}`)
        } catch (error) {
          console.error("이 프로젝트의 API 스펙이 아직 없습니다. 새로 생성됩니다.", error)
        }
      } catch (err) {
        console.error("프로젝트 데이터 로드 오류:", err)
        setError("프로젝트 정보를 불러오는 중 오류가 발생했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectData()
  }, [projectId])

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-700">프로젝트 정보를 불러오는 중...</span>
      </div>
    )
  }

  // 오류 발생 시 표시
  if (error || !projectInfo) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-600 text-xl mb-4">{error || "프로젝트를 찾을 수 없습니다"}</div>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          메인으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <main className="p-0">
      {/* 상단 네비게이션 바 */}
      <div className="bg-white shadow-sm border-b mb-4">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/project/${projectId}`} className="text-gray-600 hover:text-gray-900 flex items-center">
                ← {projectInfo.title} 정보로 돌아가기
              </Link>
            </div>
            <div className="text-lg font-semibold text-gray-800">API 설계</div>
          </div>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="py-6 bg-gradient-to-r white">
        <div className="max-w-full mx-auto px-6">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
            {/* 단계 선 (배경) */}
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 rounded-full"></div>

            {/* 진행 바 */}
            <div className="absolute top-1/2 left-0 w-1/2 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 -translate-y-1/2 rounded-full shadow-sm"></div>

            {/* 단계 1 - 완료 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white mb-2 text-sm font-medium z-10 shadow-md transform transition-transform duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap transition-colors group-hover:text-indigo-600">전역 설정</span>
            </div>

            {/* 단계 2 - 현재 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white mb-2 text-sm font-medium z-10 shadow-md transform transition-transform duration-300 group-hover:scale-110">
                <span>2</span>
              </div>
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap transition-colors group-hover:text-indigo-600">API 제작</span>
            </div>

            {/* 단계 3 - 미완료 */}
            <div className="relative flex flex-col items-center group">
              <div className="w-10 h-15 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 mb-2 text-sm font-medium z-10 shadow-sm transform transition-transform duration-300 group-hover:scale-110 group-hover:border-gray-300">
                <span>3</span>
              </div>
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap transition-colors group-hover:text-gray-600">API 도식화</span>
            </div>
          </div>
        </div>
      </div>
      <ApiCreator />
    </main>
  )
}
