"use client"

import ApiCreator from "@/components/api-creator/ApiCreator"
import ApiHeader from "@/components/header/apiheader"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"

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

        // API가 없는 경우 임시 데이터 설정 (실제 구현 시 이 부분을 API 호출로 대체)
        setProjectInfo({
          id: projectId,
          title: `프로젝트 ${projectId}`,
        })

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
    <>
      <ApiHeader projectId={projectId} project={projectInfo} />
      <main className="p-0">
        <ApiCreator projectId={projectId} />
      </main>
    </>
  )
}
