// app/utils/auth.ts

// 기존 함수 유지
export const getGoogleLoginUrl = (): string => {
  const googleAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL || "http://localhost:8080/oauth2/authorization/google"
  console.log(googleAuthUrl)
  return googleAuthUrl
}

// JWT 토큰 만료 시간 확인 함수 (서버 요청 없이 클라이언트에서 확인 가능)
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true

  try {
    // JWT 토큰 파싱 (payload 부분 추출)
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )

    const { exp } = JSON.parse(jsonPayload)

    // 현재 시간과 만료 시간 비교
    return exp * 1000 < Date.now()
  } catch (error) {
    console.error("토큰 파싱 실패:", error)
    return true // 파싱 실패 시 만료된 것으로 간주
  }
}
