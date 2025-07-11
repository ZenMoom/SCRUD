import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * GET 요청 처리 - GitHub 레포지토리의 트리 구조 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수와 쿼리 파라미터 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    // /api/github/repos/[owner]/[repo]/git/trees/[sha] 형식의 URL에서 매개변수 추출
    const owner = pathParts[4]; // /api/github/repos/[owner]
    const repo = pathParts[5];  // /api/github/repos/[owner]/[repo]
    const sha = pathParts[8];   // /api/github/repos/[owner]/[repo]/git/trees/[sha]
    
    // 쿼리 파라미터에서 recursive 옵션 추출
    const recursive = url.searchParams.get('recursive') === '1' ? '1' : '';
    
    // GitHub 인증 토큰은 요청 헤더에서 가져옴
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'GitHub 토큰이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // GitHub API 엔드포인트 URL 구성
    const apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/trees/${sha}${
      recursive ? '?recursive=1' : ''
    }`;
    
    // GitHub API 호출
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      }
    });
    
    // API 응답 그대로 반환 (변환 없음)
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('GitHub API 요청 오류:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        error.response.data || { message: 'GitHub API 요청 처리 중 오류가 발생했습니다.' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 