/**
 * GitHub API 클라이언트
 * route.ts API 엔드포인트를 호출하는 함수들을 제공합니다.
 */
import axios from 'axios';

/**
 * 사용자의 GitHub 저장소 목록을 가져옵니다.
 * @param token - GitHub 액세스 토큰
 */
export async function fetchRepositories(token: string) {
  const response = await axios.get('/api/github/user/repos', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

/**
 * 저장소의 특정 경로의 콘텐츠를 가져옵니다.
 * @param token - GitHub 액세스 토큰
 * @param owner - 저장소 소유자
 * @param repo - 저장소 이름
 * @param path - 가져올 콘텐츠의 경로 (빈 문자열이면 루트)
 */
export async function fetchContents(token: string, owner: string, repo: string, path: string = '') {
  const response = await axios.get('/api/github/user/repos', {
    params: {
      action: 'contents',
      owner,
      repo,
      path
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

/**
 * 파일의 내용을 가져옵니다.
 * @param token - GitHub 액세스 토큰
 * @param url - 파일의 다운로드 URL
 * @param path - 파일의 경로
 */
export async function fetchFileContent(token: string, url: string, path: string) {
  const response = await axios.get('/api/github/user/repos', {
    params: {
      action: 'file',
      url,
      path
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

/**
 * 파일을 선택하거나 선택 해제합니다.
 * @param token - GitHub 액세스 토큰
 * @param url - 파일의 다운로드 URL
 * @param path - 파일의 경로
 * @param isSelected - 현재 선택된 상태인지 여부
 */
export async function toggleFileSelection(token: string, url: string, path: string, isSelected: boolean) {
  const response = await axios.get('/api/github/user/repos', {
    params: {
      action: 'selectFile',
      url,
      path,
      isSelected
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
} 