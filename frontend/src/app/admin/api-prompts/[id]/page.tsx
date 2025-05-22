"use client"

import useAuthStore from "@/app/store/useAuthStore"
import GlobalHeader from "@/components/header/globalheader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatToKST } from "@/util/dayjs"
import type { PostStatusEnumDto } from "@generated/model"
import { AlertCircle, ArrowLeft, Check, Copy, ImageIcon, Mail, Shield, UserIcon } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// API 프롬프트 타입 정의
interface ApiPrompt {
  apiPromptId: string
  prompt: string
  response: string
  createdAt: string
  updatedAt: string
  user?: User
}

// 사용자 타입 정의
interface User {
  username?: string
  profileImgUrl?: string
  role?: PostStatusEnumDto
  loginId?: string
}

// 코드 에디터 컴포넌트
interface CodeEditorProps {
  code: string
  language?: string
  title?: string
}

function CodeEditor({ code, language = "json", title = "코드" }: CodeEditorProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("클립보드 복사 실패:", err)
    }
  }

  // 코드에 줄 번호 추가
  const codeWithLineNumbers = code.split("\n").map((line, index) => {
    return (
      <div key={index} className="flex">
        <div className="w-12 pr-4 text-right text-gray-500 select-none">{index + 1}</div>
        <div className="flex-1">{line || " "}</div>
      </div>
    )
  })

  return (
    <div className="dark:border-gray-700 overflow-hidden border border-gray-200 rounded-md">
      {/* 에디터 헤더 */}
      <div className="dark:bg-gray-800 flex items-center justify-between px-4 py-2 bg-gray-100">
        <div className="flex items-center">
          <span className="text-sm font-medium">{title}</span>
          <span className="dark:bg-gray-700 dark:text-gray-300 px-2 py-1 ml-2 text-xs text-gray-600 bg-gray-200 rounded">
            {language}
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none text-gray-500"
          title="클립보드에 복사"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* 에디터 본문 */}
      <div className="bg-gray-50 dark:bg-gray-900 max-h-[600px] p-4 overflow-auto font-mono text-sm">
        <div className="min-w-max">{codeWithLineNumbers}</div>
      </div>
    </div>
  )
}

// 사용자 정보 컴포넌트
interface UserProfileProps {
  user?: User
}

function UserProfile({ user }: UserProfileProps) {
  // 사용자 정보가 없는 경우 처리
  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
          <p className="text-gray-500">사용자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  // 역할에 따른 배지 색상 설정
  const getRoleBadgeColor = (role?: PostStatusEnumDto) => {
    if (!role) return "bg-gray-100 text-gray-800"

    switch (role) {
      case "ADMIN" as PostStatusEnumDto:
        return "bg-red-100 text-red-800"
      case "MANAGER" as PostStatusEnumDto:
        return "bg-blue-100 text-blue-800"
      case "USER" as PostStatusEnumDto:
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {user.profileImgUrl ? (
            <img
              src={user.profileImgUrl || "/placeholder.svg"}
              alt={`${user.username || "사용자"}의 프로필 이미지`}
              className="object-cover w-16 h-16 border-2 border-gray-200 rounded-full"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
              <UserIcon className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* 사용자 기본 정보 */}
        <div className="flex-1 ml-4">
          <h3 className="text-lg font-medium text-gray-900">{user.username || "이름 없음"}</h3>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
            >
              {user.role || "역할 없음"}
            </span>
          </div>
        </div>
      </div>

      {/* 사용자 상세 정보 */}
      <div className="pt-4 mt-6 border-t border-gray-200">
        <dl className="sm:grid-cols-2 grid grid-cols-1 gap-4">
          <div className="flex items-center">
            <dt className="flex items-center text-sm font-medium text-gray-500">
              <Mail className="w-4 h-4 mr-2" />
              로그인 ID
            </dt>
            <dd className="ml-2 text-sm text-gray-900">{user.loginId || "없음"}</dd>
          </div>
          <div className="flex items-center">
            <dt className="flex items-center text-sm font-medium text-gray-500">
              <Shield className="w-4 h-4 mr-2" />
              권한
            </dt>
            <dd className="ml-2 text-sm text-gray-900">{user.role || "없음"}</dd>
          </div>
          <div className="flex items-center">
            <dt className="flex items-center text-sm font-medium text-gray-500">
              <ImageIcon className="w-4 h-4 mr-2" />
              프로필 이미지
            </dt>
            <dd className="max-w-[200px] ml-2 text-sm text-gray-900 truncate">
              {user.profileImgUrl ? (
                <a
                  href={user.profileImgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600"
                >
                  {user.profileImgUrl}
                </a>
              ) : (
                "없음"
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// 마크다운 스타일 텍스트 컴포넌트
interface MarkdownTextProps {
  text: string
}

function MarkdownText({ text }: MarkdownTextProps) {
  // 마크다운 텍스트를 HTML로 변환
  const formatMarkdown = (text: string) => {
    // 코드 블록 (```)을 임시 태그로 변환하여 보존
    let formattedText = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="bg-gray-100 p-3 rounded-md my-4 overflow-x-auto font-mono text-sm">${code}</pre>`
    })

    // 인라인 코드 (`)를 변환
    formattedText = formattedText.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm">$1</code>',
    )

    // 헤더 (# 제목)
    formattedText = formattedText.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    formattedText = formattedText.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
    formattedText = formattedText.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')

    // 굵은 텍스트 (**텍스트**)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // 기울임 텍스트 (*텍스트*)
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // 링크 ([텍스트](URL))
    formattedText = formattedText.replace(
      /\[([^\]]+)\]$$([^)]+)$$/g,
      '<a href="$2" class="text-blue-600 hover:underline">$1</a>',
    )

    // 순서 없는 목록 (- 항목)
    formattedText = formattedText.replace(/^- (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
    formattedText = formattedText.replace(/<\/li>\n<li/g, "</li><li")
    formattedText = formattedText.replace(/(<li.*<\/li>)/g, '<ul class="my-4">$1</ul>')

    // 순서 있는 목록 (1. 항목)
    formattedText = formattedText.replace(/^\d+\. (.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
    formattedText = formattedText.replace(/<\/li>\n<li/g, "</li><li")
    formattedText = formattedText.replace(/(<li class="ml-6 list-decimal".*<\/li>)/g, '<ol class="my-4">$1</ol>')

    // 인용문 (> 텍스트)
    formattedText = formattedText.replace(
      /^> (.*$)/gm,
      '<blockquote class="pl-4 border-l-4 border-gray-300 italic my-4">$1</blockquote>',
    )

    // 수평선 (---)
    formattedText = formattedText.replace(/^---$/gm, '<hr class="my-6 border-t border-gray-300">')

    // 줄바꿈 유지
    formattedText = formattedText.replace(/\n/g, "<br>")

    return formattedText
  }

  return <div className="max-w-none prose-sm prose" dangerouslySetInnerHTML={{ __html: formatMarkdown(text) }} />
}

// JSON 형식 데이터를 찾아 포매팅하는 컴포넌트
interface FormattedContentProps {
  content: string
}

function FormattedContent({ content }: FormattedContentProps) {
  // JSON 형식 데이터를 찾는 함수
  const findJsonObjects = (text: string) => {
    const result = []
    let currentIndex = 0

    // 간단한 JSON 객체 또는 배열 패턴 찾기
    const jsonPattern = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g
    let match

    while ((match = jsonPattern.exec(text)) !== null) {
      // 매치된 부분이 유효한 JSON인지 확인
      try {
        JSON.parse(match[0])

        // 매치 이전의 텍스트
        if (match.index > currentIndex) {
          result.push({
            type: "text",
            content: text.substring(currentIndex, match.index),
          })
        }

        // 매치된 JSON
        result.push({
          type: "json",
          content: match[0],
        })

        currentIndex = match.index + match[0].length
      } catch {
        // 유효한 JSON이 아니면 무시
        continue
      }
    }

    // 마지막 매치 이후의 텍스트
    if (currentIndex < text.length) {
      result.push({
        type: "text",
        content: text.substring(currentIndex),
      })
    }

    return result
  }

  // 포매팅된 JSON 문자열 생성
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }

  // 콘텐츠 파싱
  const parsedContent = findJsonObjects(content)

  return (
    <div className="space-y-4">
      {parsedContent.map((item, index) => {
        if (item.type === "json") {
          return (
            <CodeEditor key={index} code={formatJson(item.content)} language="json" title={`JSON 객체 #${index + 1}`} />
          )
        } else {
          return (
            <div key={index} className="chat-message">
              <MarkdownText text={item.content} />
            </div>
          )
        }
      })}
    </div>
  )
}

export default function ApiPromptDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, user, token } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiPrompt, setApiPrompt] = useState<ApiPrompt | null>(null)

  const promptId = params.id as string

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
    if (!isAdmin || !token || !promptId) return

    const fetchApiPrompt = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/api-prompts/${promptId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`API 프롬프트를 불러오는데 실패했습니다. (상태 코드: ${response.status})`)
        }

        const data = await response.json()
        setApiPrompt(data)
      } catch (err) {
        console.error(formatToKST(new Date().toISOString()), "API 프롬프트 상세 조회 오류:", err)
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiPrompt()
  }, [isAdmin, token, promptId])

  // 로딩 중 표시
  if (isLoading) {
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

  // 에러 표시
  if (error) {
    return (
      <div className="bg-gray-50 flex flex-col min-h-screen">
        <GlobalHeader />

        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/admin/api-prompts" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">API 프롬프트 상세</h1>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // 데이터 없음 표시
  if (!apiPrompt) {
    return (
      <div className="bg-gray-50 flex flex-col min-h-screen">
        <GlobalHeader />

        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/admin/api-prompts" className="mr-4">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">API 프롬프트 상세</h1>
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>해당 API 프롬프트를 찾을 수 없습니다.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen">
      <GlobalHeader />

      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/admin/api-prompts" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">API 프롬프트 상세</h1>
        </div>

        <div className="md:grid-cols-3 grid grid-cols-1 gap-6 mb-6">
          {/* 메타데이터 카드 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>메타데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프롬프트 ID</h3>
                  <p className="mt-1">{apiPrompt.apiPromptId}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">생성일</h3>
                  <p className="mt-1">
                    {new Date(apiPrompt.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">수정일</h3>
                  <p className="mt-1">
                    {new Date(apiPrompt.updatedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 정보 카드 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfile user={apiPrompt.user} />
            </CardContent>
          </Card>
        </div>

        {/* 프롬프트와 응답 내용을 동시에 표시 */}
        <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
          {/* 프롬프트 내용 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>프롬프트 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] chat-container p-4 overflow-auto bg-white rounded-md">
                <FormattedContent content={apiPrompt.prompt} />
              </div>
            </CardContent>
          </Card>

          {/* 응답 내용 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>응답 내용</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] chat-container p-4 overflow-auto bg-white rounded-md">
                <FormattedContent content={apiPrompt.response} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 목록으로 돌아가기 버튼 */}
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/admin/api-prompts">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
