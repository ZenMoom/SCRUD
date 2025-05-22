"use client"

import type React from "react"

import useAuthStore from "@/app/store/useAuthStore"
import GlobalHeader from "@/components/header/globalheader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatToKST } from "@/util/dayjs"
import type { PostStatusEnumDto } from "@generated/model"
import { AlertCircle, ArrowLeft, ArrowRight, Search, UserIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// API 프롬프트 타입 정의
interface ApiPrompt {
  apiPromptId: string
  prompt: string
  response: string
  createdAt: string
  updatedAt: string
  user: User
}

// 사용자 타입 정의
interface User {
  username: string
  profileImgUrl?: string
  role: PostStatusEnumDto
  loginId: string
}

// 페이지네이션 타입 정의
interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export default function ApiPromptsPage() {
  const router = useRouter()
  const { isAuthenticated, user, token } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiPrompts, setApiPrompts] = useState<ApiPrompt[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")

  // 인증 및 권한 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user && user.role === ("ADMIN" as PostStatusEnumDto)) {
      setIsAdmin(true)
    } else {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  // API 프롬프트 데이터 로드
  useEffect(() => {
    if (!isAdmin || !token) return

    const fetchApiPrompts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = new URL("/api/admin/api-prompts", window.location.origin)
        url.searchParams.append("page", pagination.page.toString())
        url.searchParams.append("limit", pagination.limit.toString())
        if (searchTerm) {
          url.searchParams.append("search", searchTerm)
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`API 프롬프트를 불러오는데 실패했습니다. (상태 코드: ${response.status})`)
        }

        const data = await response.json()
        setApiPrompts(data.prompts)
        setPagination(data.pagination)
      } catch (err) {
        console.error(formatToKST(new Date().toISOString()), "API 프롬프트 목록 조회 오류:", err)
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiPrompts()
  }, [isAdmin, token, pagination.page, pagination.limit, searchTerm])

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 })) // 검색 시 첫 페이지로 이동
  }

  // 로딩 중 표시
  if (isLoading && apiPrompts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin border-t-transparent w-10 h-10 border-4 border-blue-500 rounded-full"></div>
      </div>
    )
  }

  // 관리자 권한 없음 표시
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>관리자 권한이 필요합니다.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/")}>
          메인 페이지로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen">
      <GlobalHeader />

      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/admin" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">API 프롬프트 관리</h1>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-grow">
            <Search className="left-2.5 top-2.5 absolute w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="프롬프트 내용 검색..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit">검색</Button>
        </form>

        {/* 에러 표시 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* API 프롬프트 목록 */}
        {apiPrompts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">API 프롬프트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {apiPrompts.map((prompt) => (
              <Card key={prompt.apiPromptId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h2 className="mb-2 text-lg font-semibold">프롬프트 ID: {prompt.apiPromptId}</h2>

                      {/* 사용자 정보 */}
                      <div className="flex items-center mb-3 text-sm text-gray-600">
                        <UserIcon className="w-4 h-4 mr-1" />
                        <span>{prompt.user?.username || "알 수 없는 사용자"}</span>
                        {prompt.user?.role && (
                          <span className="py-0.5 px-2 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">
                            {prompt.user.role}
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="mb-1 text-sm font-medium text-gray-500">프롬프트</h3>
                        <p className="line-clamp-2 text-sm">{prompt.prompt}</p>
                      </div>
                      <div className="mb-4">
                        <h3 className="mb-1 text-sm font-medium text-gray-500">응답</h3>
                        <p className="line-clamp-2 text-sm">{prompt.response}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        마지막 업데이트:{" "}
                        {new Date(prompt.updatedAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <Button asChild className="ml-4">
                      <Link href={`/admin/api-prompts/${prompt.apiPromptId}`}>상세 보기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="mx-4">
              {pagination.page} / {pagination.totalPages} 페이지
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
