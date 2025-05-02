"use client"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

// 프로젝트 상세 타입 정의
interface ProjectDetail {
  id: string
  title: string
  description: string
  createdAt: string
  content?: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 예시 프로젝트 데이터 - 실제로는 API에서 가져와야 함
  useEffect(() => {
    // 서버에서 프로젝트 데이터를 가져오는 API 호출을 시뮬레이션
    setTimeout(() => {
      setProject({
        id: params.id as string,
        title: "프로젝트 제목",
        description: "프로젝트 개요가 들어가는 부분입니다. 이며 상세 설명이 포함됩니다.",
        createdAt: "20xx.xx.xx",
        content: "프로젝트의 자세한 내용이 이곳에 표시됩니다. 실제로는 서버에서 데이터를 가져와야 합니다.",
      })
      setIsLoading(false)
    }, 500)
  }, [params.id])

  const handleDelete = () => {
    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      console.log("프로젝트 삭제:", params.id)
      // 삭제 API 호출 후 성공 시 메인 페이지로 이동
      router.push("/")
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-60 text-lg text-gray-600">로딩 중...</div>
  }

  if (!project) {
    return <div className="flex justify-center items-center h-60 text-lg text-red-700">프로젝트를 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-base text-gray-600 no-underline flex items-center transition-colors hover:text-black">
          ← 메인으로 돌아가기
        </Link>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded hover:bg-gray-200 transition-colors">수정</button>
          <button className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded hover:bg-red-200 transition-colors" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">{project.title}</h1>
        <div className="text-sm text-gray-500 mb-8">생성일: {project.createdAt}</div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">프로젝트 개요</h2>
          <p>{project.description}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">내용</h2>
          <p>{project.content}</p>
        </div>
      </div>
    </div>
  )
}
