import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import useAuthStore from "../store/useAuthStore"
import { isTokenExpired } from "../utils/auth"

/**
 * 토큰 유효성을 주기적으로 검사하는 커스텀 훅
 * @param validateInterval 토큰 검증 간격 (ms)
 */
const useTokenValidator = (validateInterval = 60000) => {
  const router = useRouter()
  const { token, logout, isAuthenticated } = useAuthStore()

  // 토큰 만료 처리 함수를 useCallback으로 메모이제이션
  const handleExpiredToken = useCallback(() => {
    console.log("인증 토큰이 만료되었습니다. 로그아웃 처리합니다.")
    logout()
    router.push("/login")
  }, [logout, router])

  useEffect(() => {
    // 클라이언트에서 토큰 만료 확인
    const checkTokenExpiration = () => {
      if (!token || !isAuthenticated) return

      // 클라이언트에서 JWT 토큰 만료 시간 확인
      if (isTokenExpired(token)) {
        handleExpiredToken()
        return
      }
    }

    // 최초 1회 실행
    checkTokenExpiration()

    // 주기적으로 토큰 만료 확인
    const intervalId = setInterval(checkTokenExpiration, validateInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [token, isAuthenticated, validateInterval, handleExpiredToken]) // handleExpiredToken 의존성 추가

  return null
}

export default useTokenValidator
