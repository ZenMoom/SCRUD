/**
 * GitHub API 호출 유틸리티
 */
import axios from 'axios';
import { useGitHubTokenStore } from '@/store/githubTokenStore';

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = 'https://api.github.com';
// 백엔드 API 기본 URL
const BACKEND_API_BASE_URL = 'http://localhost:8080';

/**
 * GitHub OAuth 인증 코드로 액세스 토큰 교환하기
 * @param code - GitHub OAuth 인증 코드
 * @returns {Promise<string>} - GitHub 액세스 토큰
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    console.log("🔐 [GitHub] 인증 코드로 토큰 교환 시도:", code);
    
    // 백엔드를 통해 토큰 교환
    const response = await axios.post(`${BACKEND_API_BASE_URL}/api/v1/github/token`, { 
      code,
      redirect_uri: 'http://localhost:3000/globalsetting' // 명시적으로 리다이렉트 URI 지정
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
 * GitHub 액세스 토큰 가져오기
 * @returns {string} - GitHub 액세스 토큰
 * @throws {Error} - 토큰이 없거나 잘못된 타입의 토큰인 경우 에러 발생
 */
export function getGitHubToken(): string {
  const token = useGitHubTokenStore.getState().githubToken;
  
  if (!token) {
    throw new Error("GitHub 토큰이 없습니다. GitHub 인증이 필요합니다.");
  }
  
  // GitHub 토큰의 형식 확인 (GitHub 토큰은 보통 'ghu_' 또는 'ghp_'로 시작)
  if (!token.startsWith('ghu_') && !token.startsWith('ghp_')) {
    console.warn("주의: 저장된 토큰이 GitHub 토큰 형식이 아닙니다.");
  }
  
  return token;
}

/**
 * GitHub 레포지토리 정보 가져오기
 * @returns {Promise<Array<{name: string, full_name: string, [key: string]: any}>>} - 레포지토리 정보 목록
 */
export async function getGitHubRepositories() {
  const token = getGitHubToken();
  
  try {
    console.log("🔄 [GitHub] 레포지토리 요청 중...");
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };
    
    const response = await axios.get(`${GITHUB_API_BASE_URL}/user/repos`, { headers });
    console.log(`✅ [GitHub] 성공! ${response.data.length}개의 레포지토리를 가져왔습니다.`);
    return response.data;
  } catch (error) {
    console.error('🚫 [GitHub] 레포지토리 가져오기 중 오류:', error);
    throw error;
  }
}

/**
 * GitHub 레포지토리 컨텐츠 가져오기
 * @param fullName - 레포지토리 전체 이름 (사용자명/레포지토리명)
 * @param path - 가져올 파일 또는 디렉토리 경로 (옵션, 기본값은 루트 디렉토리)
 * @returns {Promise<Array<{name: string, type: string, path: string, [key: string]: any}>>} - 컨텐츠 정보
 */
export async function getGitHubRepositoryContents(fullName: string, path: string = '') {
  const token = getGitHubToken();
  
  try {
    const url = `${GITHUB_API_BASE_URL}/repos/${fullName}/contents${path ? `/${path}` : ''}`;
    console.log("🔄 [GitHub] 레포지토리 컨텐츠 요청 중:", url);
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };
    
    const response = await axios.get(url, { headers });
    console.log(`✅ [GitHub] 레포지토리 컨텐츠를 가져왔습니다.`);
    return response.data;
  } catch (error) {
    console.error('🚫 [GitHub] 레포지토리 컨텐츠 가져오기 중 오류:', error);
    throw error;
  }
}