"use client"

import type React from "react"

import ProjectCard, { type Project } from "@/components/project-card/project-card"
import { PostStatusEnumDto } from "@generated/model"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import useAuthStore from "./store/useAuthStore"
import { isTokenExpired } from "./utils/auth"

// API 요청 함수 - 다양한 오류 상황 처리 개선
const getProjects = async (): Promise<Project[]> => {
  try {
    // 인증 토큰 가져오기
    const { token } = useAuthStore.getState()

    if (!token) {
      console.error("인증 토큰이 없습니다.")
      throw new Error("인증 토큰이 없습니다.")
    }

    // 클라이언트에서 토큰 만료 여부 미리 확인
    if (isTokenExpired(token)) {
      const { logout } = useAuthStore.getState()
      logout()

      // 브라우저 환경에서만 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("토큰이 만료되었습니다")
    }

    // API 호출
    const response = await fetch("/api/projects", {
      headers: {
        Authorization: `Bearer ${token}`, // Bearer 접두사 추가 (API 요구사항에 따라 조정)
      },
    })

    // 토큰 만료로 인한 인증 오류(401) 처리
    if (response.status === 401) {
      const { logout } = useAuthStore.getState()
      logout()

      // 브라우저 환경에서만 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("토큰이 만료되었습니다")
    }

    // 서버 오류(500) 처리
    if (response.status === 500) {
      console.error("서버 내부 오류가 발생했습니다. 토큰 문제일 수 있습니다.")

      // 토큰 문제로 추정하고 로그아웃 처리
      const { logout } = useAuthStore.getState()
      logout()

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("서버 오류가 발생했습니다. 다시 로그인해주세요.")
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "알 수 없는 오류")
      console.error(`API 오류 (${response.status}): ${errorText}`)
      throw new Error(`프로젝트 목록을 불러오는데 실패했습니다. (상태 코드: ${response.status})`)
    }

    const data = await response.json()

    // 응답이 없거나 형식이 다른 경우 빈 배열 반환
    if (!data || !data.content) {
      console.warn("API 응답 데이터 형식이 예상과 다릅니다:", data)
      return []
    }

    // API 응답 데이터를 Project 타입에 맞게 변환
    return data.content.map((item: { scrudProjectId: number; title?: string; description?: string; updatedAt?: string; serverUrl?: string }) => ({
      id: item.scrudProjectId.toString(),
      title: item.title || "제목 없음",
      description: item.description || "설명 없음",
      createdAt: new Date(item.updatedAt || Date.now()).toLocaleDateString("ko-KR"),
      emoji: undefined,
      serverUrl: item.serverUrl || "",
    }))
  } catch (error: unknown) {
    console.error("프로젝트 목록 조회 오류:", error)
    throw error
  }
}

// 프로젝트 삭제 함수 - 오류 처리 개선
const deleteProject = async (id: string): Promise<void> => {
  try {
    // 인증 토큰 가져오기
    const { token } = useAuthStore.getState()

    if (!token) {
      console.error("인증 토큰이 없습니다.")
      throw new Error("인증 토큰이 없습니다.")
    }

    // 클라이언트에서 토큰 만료 여부 미리 확인
    if (isTokenExpired(token)) {
      const { logout } = useAuthStore.getState()
      logout()

      // 브라우저 환경에서만 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("토큰이 만료되었습니다")
    }

    // API 호출
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // Bearer 접두사 추가 (API 요구사항에 따라 조정)
      },
    })

    // 토큰 만료로 인한 인증 오류(401) 처리
    if (response.status === 401) {
      const { logout } = useAuthStore.getState()
      logout()

      // 브라우저 환경에서만 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("토큰이 만료되었습니다")
    }

    // 서버 오류(500) 처리
    if (response.status === 500) {
      console.error("서버 내부 오류가 발생했습니다. 토큰 문제일 수 있습니다.")

      // 토큰 문제로 추정하고 로그아웃 처리
      const { logout } = useAuthStore.getState()
      logout()

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      throw new Error("서버 오류가 발생했습니다. 다시 로그인해주세요.")
    }

    // 요청이 성공적이지 않을 경우 (204가 아닌 경우)
    if (response.status !== 204) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "프로젝트 삭제에 실패했습니다.")
    }
  } catch (error: unknown) {
    console.error("프로젝트 삭제 오류:", error)
    throw error
  }
}

// 로딩 상태 표시 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin border-t-transparent w-10 h-10 border-4 border-blue-500 rounded-full"></div>
    </div>
  )
}

// 사용자 이름에서 이메일 앞부분만 추출하는 함수
function extractUsername(email: string): string {
  if (!email) return ""
  return email.split("@")[0]
}

// 실제 홈 페이지 내용 컴포넌트
function HomeContent() {
  // 인증 및 라우터
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user } = useAuthStore()

  // 프로젝트 데이터 상태
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 구글 OAuth 콜백 처리
  useEffect(() => {
    const token = searchParams.get("token")
    const loginId = searchParams.get("loginId")
    const role: PostStatusEnumDto = searchParams.get("role") as PostStatusEnumDto
    const profileImg = searchParams.get("profileImg")

    // OAuth 콜백에서 토큰을 받았으면
    if (token && loginId) {
      // Zustand 스토어에 사용자 로그인
      login(token, {
        username: loginId,
        profileImgUrl: profileImg || undefined,
        role: role || "USER",
      })

      // 페이지 새로고침 없이 URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, document.title, "/")
    }
  }, [searchParams, login])

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProjects = async () => {
      if (!isAuthenticated) return

      setLoading(true)
      try {
        const data = await getProjects()
        setProjects(data)
        setError(null)
      } catch (err: unknown) {
        // 에러 타입 체크
        const error = err instanceof Error ? err : new Error(String(err))

        // 토큰 만료 에러인 경우 다른 메시지 표시
        if (error.message?.includes("토큰이 만료되었습니다") || error.message?.includes("다시 로그인해주세요")) {
          setError("세션이 만료되었습니다. 다시 로그인해주세요.")
        } else {
          setError("프로젝트를 불러오는데 실패했습니다.")
        }
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

  // 프로젝트 삭제 처리
  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id)
      setProjects(projects.filter((p) => p.id !== id))
    } catch (err: unknown) {
      console.error("프로젝트 삭제 오류:", err)

      alert("프로젝트 삭제에 실패했습니다.")
    }
  }

  // 로그인 페이지로 이동하는 함수
  const handleLogin = () => {
    router.push("/login")
  }

  // 사용자 이름 파싱 (이메일 형식인 경우 @ 앞부분만 추출)
  const displayName = user ? extractUsername(user.username) : ""

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 h-[calc(100vh-60px)]">
      {isAuthenticated ? (
        // 로그인된 사용자를 위한 프로젝트 목록 화면
        <div className="max-w-7xl md:py-20 px-6 py-8 mx-auto">
          <div className="mb-10">
            <h1 className="md:text-5xl text-5xl font-bold text-gray-800">
              <span className="bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 text-transparent">{displayName}</span> 님의 프로젝트
            </h1>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full"></div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && !loading && <div className="bg-red-50 p-4 mb-6 text-red-600 rounded-lg">{error}</div>}

          {/* 프로젝트 그리드 */}
          {!loading && !error && (
            <div className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid grid-cols-1 gap-6">
              {/* 새 프로젝트 버튼 */}
              <button
                onClick={handleNewProject}
                className="h-[240px] rounded-xl text-inherit hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] hover:z-10 flex flex-col items-center justify-center p-6 no-underline transition-all duration-300 border-2 border-gray-200 border-dashed"
              >
                <div className="bg-gray-50 p-4 mb-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-500">새 프로젝트 만들기</p>
              </button>

              {/* 프로젝트 카드 목록 */}
              {projects.map((project, index) => (
                <div key={project.id} className="group relative">
                  <ProjectCard project={project} index={index} onDelete={handleDeleteProject} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // 로그인되지 않은 사용자를 위한 시작 페이지
        <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 bg-white">
          <h1 className="md:text-5xl lg:text-6xl mb-8 text-4xl font-bold text-center">
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">스마트</span>
            하고 <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">효율적</span>
            으로
          </h1>
          <h2 className="md:text-4xl lg:text-5xl mb-16 text-3xl font-bold text-center">코드를 만들어 보세요</h2>
          <button onClick={handleLogin} className="hover:bg-gray-700 px-4 py-3 text-2xl font-medium text-white transition-all bg-gray-800 rounded-md">
            SCRUD 사용해 보기
          </button>
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
