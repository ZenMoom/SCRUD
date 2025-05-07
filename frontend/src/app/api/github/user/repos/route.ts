import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * GET 요청 처리 - GitHub 레포지토리 목록 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    // GitHub 인증 토큰은 요청 헤더에서 가져옴
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'GitHub 토큰이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 레포지토리 목록 가져오기
    const response = await axios.get(`${GITHUB_API_BASE_URL}/user/repos`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('GitHub 레포지토리 가져오기 오류:', error);
    
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