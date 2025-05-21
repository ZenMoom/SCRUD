import { formatToKST } from '@/util/dayjs';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// GitHub API 기본 URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

// GitHub API 응답을 위한 타입 정의
interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

/**
 * GET 요청 처리 - GitHub 레포지토리의 커밋 정보 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');

    // /api/github/repos/[owner]/[repo]/commits 형식의 URL에서 매개변수 추출
    const owner = pathParts[4]; // /api/github/repos/[owner]
    const repo = pathParts[5]; // /api/github/repos/[owner]/[repo]

    // GitHub 인증 토큰은 요청 헤더에서 가져옴
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ message: 'GitHub 토큰이 필요합니다.' }, { status: 401 });
    }

    // GitHub API를 호출하여 레포지토리 커밋 정보 가져오기
    const response = await axios.get<GitHubCommit[]>(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`,
      },
    });

    // 응답 데이터 가공 (필요한 정보만 추출)
    const commits = response.data.map((commit: GitHubCommit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
    }));

    return NextResponse.json(commits);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(formatToKST(new Date().toISOString()), 'GitHub Commits API 요청 오류:', error.response.data);

      return NextResponse.json(error.response.data || { message: 'GitHub API 요청 처리 중 오류가 발생했습니다.' }, {
        status: error.response.status,
      });
    }

    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
