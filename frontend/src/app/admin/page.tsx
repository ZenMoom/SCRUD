"use client"

import useAuthStore from "@/app/store/useAuthStore"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PostStatusEnumDto } from "@generated/model"
import { AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)

  // 인증 및 권한 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user && user.role === "ADMIN" as PostStatusEnumDto) {
      setIsAdmin(true)
    } else {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

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

      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-3xl font-bold">관리자 대시보드</h1>

        <div className="md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 gap-6">
          {/* API 프롬프트 관리 카드 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                API 프롬프트 관리
              </CardTitle>
              <CardDescription>API 프롬프트 목록을 조회하고 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/api-prompts">API 프롬프트 관리</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 사용자 관리 카드 */}
          {/* <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                사용자 관리
              </CardTitle>
              <CardDescription>사용자 계정을 조회하고 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/users">사용자 관리</Link>
              </Button>
            </CardContent>
          </Card> */}

          {/* 시스템 설정 카드 */}
          {/* <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                시스템 설정
              </CardTitle>
              <CardDescription>시스템 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/settings">시스템 설정</Link>
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}
