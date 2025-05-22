"use client"

import useAuthStore from "@/app/store/useAuthStore"
import { isTokenExpired } from "@/app/utils/auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, logout, isAuthenticated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // 초기 로딩 시 토큰 유효성 검사
  useEffect(() => {
    const checkAuth = async () => {
      // 인증 상태가 있지만 토큰이 만료된 경우
      if (isAuthenticated && token && isTokenExpired(token)) {
        console.log("토큰이 만료되었습니다. 로그아웃 처리합니다.")
        logout()
        router.push("/login")
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [isAuthenticated, token, logout, router])

  // 주기적인 토큰 검증 설정 (60초마다)
  useEffect(() => {
    const validateInterval = 60000 // 60초

    const checkTokenExpiration = () => {
      if (!token || !isAuthenticated) return

      // 클라이언트에서 JWT 토큰 만료 시간 확인
      if (isTokenExpired(token)) {
        console.log("인증 토큰이 만료되었습니다. 로그아웃 처리합니다.")
        logout()
        router.push("/login")
        return
      }
    }

    // 주기���으로 토큰 만료 확인
    const intervalId = setInterval(checkTokenExpiration, validateInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [token, isAuthenticated, logout, router])

  if (isCheckingAuth) {
    // 인증 확인 중 로딩 표시
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full"></div>
      </div>
    )
  }

  // 인증 확인 완료 후 컨텐츠 표시
  return <>{children}</>
}
