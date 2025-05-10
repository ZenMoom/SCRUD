"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useAuthStore from "./store/useAuthStore"
import ProjectCard from "@/components/project-card/project-card"
import ProjectForm from "@/components/project-card/project-form"
import { Project } from "@/components/project-card/project-card"
import Image from "next/image"

// API 요청 함수 - 실제 API 호출로 변경
const getProjects = async (): Promise<Project[]> => {
  try {
    // 인증 토큰 가져오기
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.error("인증 토큰이 없습니다.");
      throw new Error("인증 토큰이 없습니다.");
    }
    
    // API 호출
    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': token
      }
    });
    
    if (!response.ok) {
      throw new Error('프로젝트 목록을 불러오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    // 응답이 없거나 형식이 다른 경우 빈 배열 반환
    if (!data || !data.content) {
      console.warn("API 응답 데이터 형식이 예상과 다릅니다:", data);
      return [];
    }
    
    // API 응답 데이터를 Project 타입에 맞게 변환
    return data.content.map((item: { 
      scrudProjectId: number; 
      title?: string; 
      description?: string; 
      updatedAt?: string;
      serverUrl?: string;
    }) => ({
      id: item.scrudProjectId.toString(),
      title: item.title || "제목 없음",
      description: item.description || "설명 없음",
      createdAt: new Date(item.updatedAt || Date.now()).toLocaleDateString('ko-KR'),
      emoji: undefined,
      serverUrl: item.serverUrl || ""
    }));
  } catch (error) {
    console.error("프로젝트 목록 조회 오류:", error);
    throw error;
  }
};

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

// 프로젝트 삭제 함수 - API 호출로 변경
const deleteProject = async (id: string): Promise<void> => {
  try {
    // 인증 토큰 가져오기
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.error("인증 토큰이 없습니다.");
      throw new Error("인증 토큰이 없습니다.");
    }
    
    // API 호출
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });
    
    // 요청이 성공적이지 않을 경우 (204가 아닌 경우)
    if (response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '프로젝트 삭제에 실패했습니다.');
    }
    
    console.log('프로젝트가 성공적으로 삭제되었습니다.');
  } catch (error) {
    console.error("프로젝트 삭제 오류:", error);
    throw error;
  }
}

// 로딩 상태 표시 컴포넌트
function LoadingFallback() {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  )
}

// 실제 홈 페이지 내용 컴포넌트
function HomeContent() {
  // 인증 및 라우터
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, logout, isAuthenticated, user } = useAuthStore()

  // 프로젝트 데이터 상태
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 모달 상태
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // 구글 OAuth 콜백 처리
  useEffect(() => {
    const token = searchParams.get("token")
    const loginId = searchParams.get("loginId")
    const profileImg = searchParams.get("profileImg")

    // OAuth 콜백에서 토큰을 받았으면
    if (token && loginId) {
      // Zustand 스토어에 사용자 로그인
      login(token, {
        username: loginId,
        profileImgUrl: profileImg || undefined,
      })

      // 최초 로그인 시 콘솔에 로그 출력
      console.log("=== 최초 로그인 성공: 사용자 정보 ===")
      console.log("로그인 ID:", loginId)
      console.log("프로필 이미지:", profileImg || "없음")
      console.log("==============================")

      // 페이지 새로고침 없이 URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, document.title, "/")
    }
  }, [searchParams, login])

  // 인증 상태가 변경될 때마다 사용자 정보 출력 (로그인 이후 또는 새로고침 시)
  useEffect(() => {
    // 약간의 지연 시간을 두어 상태 업데이트가 완료된 후 로그를 출력
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        console.log("=== 현재 로그인된 사용자 정보 ===")
        console.log("로그인 상태:", "로그인됨")
        console.log("사용자 이름:", user.username)
        console.log("프로필 이미지:", user.profileImgUrl || "없음")
        console.log("==============================")
      } else if (!searchParams.get("token")) {
        // URL에 토큰 파라미터가 없을 때만 로그인 안됨 메시지 출력
        // 최초 로그인 중일 때는 출력하지 않음
        console.log("=== 로그인 상태 ===")
        console.log("로그인 상태: 로그인되지 않음")
        console.log("==============================")
      }
    }, 100) // 100ms 지연

    return () => clearTimeout(timer) // 클린업 함수
  }, [isAuthenticated, user, searchParams])

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/startpage")
    }
  }, [isAuthenticated, router])

  // 프로젝트 데이터 로드
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

    if (isAuthenticated) {
      loadProjects()
    }
  }, [isAuthenticated])

  // 새 프로젝트 생성 함수
  const handleNewProject = () => {
    window.location.href = "/globalsetting"
  }

  // 프로젝트 편집 함수
  const handleEditProject = (project: Project) => {
    setCurrentProject(project)
    setShowEditModal(true)
  }

  // 프로젝트 편집 제출 처리
  const handleEditSubmit = async (projectData: Omit<Project, "id" | "createdAt">) => {
    if (!currentProject) return

    setIsSubmitting(true)
    try {
      const updatedProject = await updateProject(currentProject.id, projectData)
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

  // 모달 취소 함수
  const handleCancel = () => {
    setShowEditModal(false)
    setCurrentProject(null)
  }

  // 로그아웃 함수
  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // 인증되지 않은 경우 아무것도 렌더링하지 않음 (로그인 페이지로 리다이렉트될 때까지)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-16">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">{user?.username || "바코드"}</span> 님의 프로젝트
          </h1>

          {/* 프로필 및 로그아웃 버튼 */}
          <div className="flex items-center">
            {user?.profileImgUrl && (
              <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
                <Image src={user.profileImgUrl} alt="프로필" width={40} height={40} className="object-cover w-full h-full" />
              </div>
            )}
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              로그아웃
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && !loading && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        {/* 프로젝트 그리드 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 새 프로젝트 버튼 */}
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

export default function Home(): React.ReactNode {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  )
}
