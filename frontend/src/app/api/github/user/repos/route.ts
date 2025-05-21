import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

// 레포지토리 타입 정의
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

/**
 * GET 요청 처리 - GitHub 레포지토리 목록 또는 컨텐츠 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 파라미터 가져오기
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    // GitHub 인증 토큰은 요청 헤더에서 가져옴
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'GitHub 토큰이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // action 파라미터에 따라 다른 처리
    if (action === 'contents') {
      // 레포지토리 컨텐츠 가져오기
      const owner = url.searchParams.get('owner');
      const repo = url.searchParams.get('repo');
      const path = url.searchParams.get('path') || '';
      
      if (!owner || !repo) {
        return NextResponse.json(
          { message: '저장소 소유자와 이름이 필요합니다.' },
          { status: 400 }
        );
      }
      
      const response = await axios.get(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`
        }
      });
      
      // 파일 목록을 폴더와 파일로 분류해서 폴더가 먼저 오도록 정렬
      const sortedContents = Array.isArray(response.data) ? 
        response.data
          .map(item => ({
            name: item.name,
            path: item.path,
            type: item.type === 'dir' ? 'dir' : 'file',
            size: item.size,
            download_url: item.download_url,
            html_url: item.html_url
          }))
          .sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === 'dir' ? -1 : 1;
          }) 
        : [];
      
      return NextResponse.json(sortedContents);
    } else if (action === 'file') {
      // 파일 내용 가져오기 (URL로부터)
      const fileUrl = url.searchParams.get('url');
      const filePath = url.searchParams.get('path');
      
      if (!fileUrl) {
        return NextResponse.json(
          { message: '파일 URL이 필요합니다.' },
          { status: 400 }
        );
      }
      
      // 파일 내용 가져오기
      const response = await axios.get(fileUrl, {
        headers: {
          'Authorization': `token ${token}`
        }
      });
      
      // 파일 내용 처리 및 반환
      const content = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);
      
      return NextResponse.json({
        path: filePath || '',
        content: content
      });
    } else if (action === 'selectFile') {
      // 파일 선택/해제 처리
      const filePath = url.searchParams.get('path');
      const fileUrl = url.searchParams.get('url');
      const isSelected = url.searchParams.get('isSelected') === 'true';
      
      if (!filePath || !fileUrl) {
        return NextResponse.json(
          { message: '파일 경로와 URL이 필요합니다.' },
          { status: 400 }
        );
      }
      
      if (isSelected) {
        // 이미 선택된 파일은 선택 해제 상태로 반환
        return NextResponse.json({ 
          selected: false,
          path: filePath
        });
      } else {
        // 파일 내용 가져오기
        const response = await axios.get(fileUrl, {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        
        // 파일 내용 처리 및 선택 상태로 반환
        const content = typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data);
          
        return NextResponse.json({
          selected: true,
          path: filePath,
          content: content
        });
      }
    } else {
      // 레포지토리 목록 가져오기
      const response = await axios.get(`${GITHUB_API_BASE_URL}/user/repos`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`
        }
      });
      
      // 레포지토리 정보 정리 및 반환
      const repos = response.data.map((repo: GitHubRepo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: {
          login: repo.owner.login
        }
      }));
      
      return NextResponse.json(repos);
    }
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