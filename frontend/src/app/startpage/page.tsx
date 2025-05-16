"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import useAuthStore from "../store/useAuthStore"

export default function StartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // 로그인 상태 확인 및 리다이렉트
  useEffect(() => {
    // 이미 로그인된 사용자는 홈으로 리다이렉트
    if (isAuthenticated) {
      console.log("이미 로그인되어 있습니다. 홈으로 리다이렉트합니다.")
      router.push("/")
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8">
        <span className="bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text">스마트</span>
        하고 <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">효율적</span>
        으로
      </h1>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16">코드를 만들어 보세요</h2>
      <button onClick={() => router.push("/login")} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-md text-2xl font-medium transition-all">
        SCRUD 사용해 보기
      </button>
    </div>
  )
}
