import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// POST 요청 처리
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const body = await request.json();
    const authorization = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhY2Nlc3NUb2tlbiIsInVzZXJuYW1lIjoidmphd2IyMjYyQGdtYWlsLmNvbSIsImlkIjoiODY4MDAzYzgtZGVhYS00MTE0LWJiZGUtN2YzNGQ4NTE4MjYxIiwiaWF0IjoxNzQ2NjAyNDczLCJleHAiOjE3NDY2MDg0NzN9.lkZqWPclba8rwBaTyWd97-Zsl4mPdNMDLu87bgE0HsM';
    
    // 백엔드 서버로 요청 전달 (axios 사용)
    const response = await axios.post('http://localhost:8080/api/v1/projects', body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });
    
    // 응답 상태코드 유지하면서 결과 반환
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('프로젝트 생성 API 오류:', error);
    
    // axios 에러 객체에서 응답 정보 추출
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        error.response.data || { message: '요청 처리 중 오류가 발생했습니다.' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 