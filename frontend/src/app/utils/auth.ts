// app/utils/auth.ts

export const getGoogleLoginUrl = (): string => {
  const googleAuthUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL || "http://localhost:8080/oauth2/authorization/google"
  return googleAuthUrl
}
