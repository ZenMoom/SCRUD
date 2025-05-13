/**
 * GitHub OAuth 인증 관련 유틸리티
 */
import axios from 'axios';
import { useGitHubTokenStore } from '@/store/githubTokenStore';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

/**
 * GitHub OAuth 인증 URL 생성
 * @param redirectUri - 인증 후 리다이렉트할 URI
 * @returns {string} - 인증 URL
 */
export function getGitHubAuthUrl(redirectUri: string = `${apiUrl}/globalsetting`): string {
  return `${apiUrl}/oauth2/authorize/github?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * GitHub OAuth 인증 코드로 액세스 토큰 교환하기
 * @param code - GitHub OAuth 인증 코드
 * @returns {Promise<string>} - GitHub 액세스 토큰
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    console.log("🔐 [GitHub] 인증 코드로 토큰 교환 시도:", code);
    
    // 백엔드를 통해 토큰 교환
    const response = await axios.post(`${apiUrl}/api/github/token`, { 
      code,
      redirect_uri: `${apiUrl}/globalsetting` // 명시적으로 리다이렉트 URI 지정
    });
    
    console.log("✅ [GitHub] 백엔드 토큰 교환 응답:", response.data);
    
    // 응답에서 토큰 추출
    const token = response.data.token || response.data.access_token;
    
    if (!token) {
      throw new Error("GitHub 토큰을 받지 못했습니다.");
    }
    
    // GitHub 토큰 확인 (ghu_ 또는 ghp_로 시작하는지)
    if (token.startsWith('ghu_') || token.startsWith('ghp_')) {
      console.log("✅ GitHub 토큰 형식 확인됨");
      useGitHubTokenStore.getState().setGithubToken(token);
    } else {
      console.warn("⚠️ 받은 토큰이 GitHub 토큰 형식이 아닙니다:", token.substring(0, 10) + "...");
    }
    
    console.log("🔑 [GitHub] 백엔드에서 토큰 받음");
    return token;
  } catch (error) {
    console.error("🚫 [GitHub] 토큰 교환 중 오류:", error);
    throw error;
  }
}

/**
 * GitHub 인증 초기화 (토큰 제거)
 */
export function clearGitHubAuth(): void {
  localStorage.removeItem('github-token-direct');
  useGitHubTokenStore.getState().setGithubToken('');
} 