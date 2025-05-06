"use client"

import { useState, useEffect } from "react"
import { Project } from "@/components/project-card/project-card"
import ProjectCard from "@/components/project-card/project-card"
import ProjectForm from "@/components/project-card/project-form"
// import { useRouter } from "next/navigation"

// API 요청 더미 함수 (나중에 실제 API로 교체)
const getProjects = async (): Promise<Project[]> => {
  // 로컬 스토리지에서 프로젝트 데이터 불러오기 (개발용)
  try {
    if (typeof window !== "undefined") {
      const savedProjects = localStorage.getItem("projects")
      if (savedProjects) {
        return JSON.parse(savedProjects)
      }
    }
  } catch (error) {
    console.error("로컬 스토리지 접근 오류:", error)
  }

  // 기본 더미 프로젝트 데이터
  const dummyProjects: Project[] = [
    {
      id: "1",
      title: "마케팅 캠페인",
      description: "2024년 2분기 디지털 마케팅 캠페인 기획 및 실행 프로젝트. 주요 소셜 미디어 플랫폼에서의 브랜드 인지도 향상이 목표입니다.",
      createdAt: "2024.05.01",
      emoji: "📊",
    },
    {
      id: "2",
      title: "모바일 앱 개발",
      description: "사용자 피드백을 반영한 모바일 앱 리디자인 및 신규 기능 개발 프로젝트. 사용자 경험 개선에 중점을 둡니다.",
      createdAt: "2024.04.15",
      emoji: "📱",
    },
    {
      id: "3",
      title: "데이터 분석 대시보드",
      description: "실시간 데이터 모니터링을 위한 대시보드 개발. 주요 비즈니스 지표를 시각화하여 의사결정에 도움을 줍니다.",
      createdAt: "2024.04.10",
      emoji: "📈",
    },
    {
      id: "4",
      title: "신규 서비스 론칭",
      description: "B2B 고객을 위한 새로운 구독 서비스 론칭 준비. 시장 조사, 가격 책정, 마케팅 전략 수립 등의 작업이 포함됩니다.",
      createdAt: "2024.03.28",
      emoji: "🚀",
    },
  ]

  // 로컬 스토리지에 초기 데이터 저장 (브라우저 환경일 경우만)
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("projects", JSON.stringify(dummyProjects))
    }
  } catch (error) {
    console.error("로컬 스토리지 저장 오류:", error)
  }

  return dummyProjects
}

// 프로젝트 수정 더미 함수
const updateProject = async (id: string, projectData: Omit<Project, "id" | "createdAt">): Promise<Project> => {
  // 로컬 스토리지에서 기존 프로젝트 불러오기
  let projects: Project[] = []

  try {
    if (typeof window !== "undefined") {
      const savedProjects = localStorage.getItem("projects")
      projects = savedProjects ? JSON.parse(savedProjects) : []
    }
  } catch (error) {
    console.error("로컬 스토리지 접근 오류:", error)
    throw new Error("프로젝트를 찾을 수 없습니다.")
  }

  // 해당 ID의 프로젝트 찾기
  const projectIndex = projects.findIndex((p: Project) => p.id === id)
  if (projectIndex === -1) {
    throw new Error("프로젝트를 찾을 수 없습니다.")
  }

  // 프로젝트 수정
  const updatedProject: Project = {
    ...projects[projectIndex],
    ...projectData,
  }

  // 업데이트된 프로젝트 저장
  projects[projectIndex] = updatedProject

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("projects", JSON.stringify(projects))
    }
  } catch (error) {
    console.error("로컬 스토리지 저장 오류:", error)
    throw new Error("프로젝트 저장에 실패했습니다.")
  }

  return updatedProject
}

// 프로젝트 삭제 더미 함수
const deleteProject = async (id: string): Promise<void> => {
  // 로컬 스토리지에서 기존 프로젝트 불러오기
  let projects: Project[] = []

  try {
    if (typeof window !== "undefined") {
      const savedProjects = localStorage.getItem("projects")
      projects = savedProjects ? JSON.parse(savedProjects) : []
    }
  } catch (error) {
    console.error("로컬 스토리지 접근 오류:", error)
    throw new Error("프로젝트를 찾을 수 없습니다.")
  }

  // 해당 ID의 프로젝트 제외하기
  const filteredProjects = projects.filter((p: Project) => p.id !== id)

  // 업데이트된 프로젝트 저장
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("projects", JSON.stringify(filteredProjects))
    }
  } catch (error) {
    console.error("로컬 스토리지 저장 오류:", error)
    throw new Error("프로젝트 삭제에 실패했습니다.")
  }
}

// 메인 페이지 컴포넌트
export default function Home() {
  // 프로젝트 데이터 상태
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // 프로젝트 로드
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      try {
        const data = await getProjects()
        setProjects(data)
        setError(null)
      } catch (err) {
        setError("프로젝트를 불러오는데 실패했습니다.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // const router = useRouter()
  // // 새 프로젝트 생성 함수

  const handleNewProject = () => {
    // 프로젝트 생성 후 API Creator 페이지로 이동
    window.location.href = "/globalsetting"
    // 또는 Next.js의 라우터를 사용할 경우:
    // router.push("/api-creator");
  }

  // 프로젝트 편집 모달 열기
  const handleEditProject = (project: Project) => {
    setCurrentProject(project)
    setShowEditModal(true)
  }

  // 프로젝트 편집 처리
  const handleEditSubmit = async (projectData: Omit<Project, "id" | "createdAt">) => {
    if (!currentProject) return

    setIsSubmitting(true)
    try {
      const updatedProject = await updateProject(currentProject.id, projectData)

      // 프로젝트 목록 업데이트
      setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)))

      setShowEditModal(false)
      setCurrentProject(null)
    } catch (err) {
      console.error("프로젝트 수정 오류:", err)
      alert("프로젝트 수정에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 프로젝트 삭제 처리
  const handleDeleteProject = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteProject(id)

      // 프로젝트 목록에서 삭제된 프로젝트 제거
      setProjects(projects.filter((p) => p.id !== id))

      setShowEditModal(false)
      setCurrentProject(null)
    } catch (err) {
      console.error("프로젝트 삭제 오류:", err)
      alert("프로젝트 삭제에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 모달 닫기
  const handleCancel = () => {
    setShowEditModal(false)
    setCurrentProject(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-16">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">바코드</span> 님의 프로젝트
          </h1>
        </div>

        {/* 로딩 상태 표시 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}

        {/* 에러 메시지 표시 */}
        {error && !loading && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        {/* 프로젝트 그리드 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 새 프로젝트 추가 버튼 */}
            <button
              onClick={handleNewProject}
              className="flex flex-col items-center justify-center p-6 h-[220px] rounded-xl border-2 border-dashed border-gray-200 text-inherit no-underline transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] hover:z-10"
            >
              <div className="mb-3 bg-gray-50 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">새 프로젝트 만들기</p>
            </button>

            {/* 프로젝트 카드 목록 */}
            {projects.map((project, index) => (
              <div key={project.id} className="relative group">
                <ProjectCard project={project} index={index} />

                {/* 편집 버튼 오버레이 (호버 시 표시) */}
                <button
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEditProject(project)
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 프로젝트 편집 모달 */}
      {showEditModal && currentProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <ProjectForm project={currentProject} onSubmit={handleEditSubmit} onDelete={handleDeleteProject} onCancel={handleCancel} isSubmitting={isSubmitting} />
          </div>
        </div>
      )}
    </div>
  )
}
