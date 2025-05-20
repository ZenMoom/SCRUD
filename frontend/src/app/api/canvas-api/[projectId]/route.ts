import { type NextRequest, NextResponse } from 'next/server';

// GET 요청 핸들러 - API 목록 조회
export async function GET(request: NextRequest) {
  try {
    // URL에서 직접 경로 매개변수 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');

    // /api/canvas-api/[projectId] 형식의 URL에서 매개변수 추출
    const projectId = pathParts[3]; // /api/canvas-api/[projectId]

    if (!projectId) {
      return NextResponse.json({ error: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // API URL 가져오기
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    if (!apiUrl) {
      console.error('API_BASE_URL 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json({ error: 'API 서버 구성 오류' }, { status: 500 });
    }

    // 직접 fetch를 사용하여 API 호출
    try {
      // 문서에 따라 include 매개변수는 배열 형태로 전달해야 함
      // URL에서는 include=AI_GENERATED&include=AI_VISUALIZED 형식으로 전달됨
      const queryParams = new URLSearchParams();
      // 여러 값을 추가하려면 같은 키로 여러 번 append
      queryParams.append('include', 'AI_VISUALIZED');
      // AI_VISUALIZED는 제외 (필요에 따라 추가 가능)

      const fetchResponse = await fetch(`${apiUrl}/api/v1/projects/${projectId}/apis?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!fetchResponse.ok) {
        throw new Error(`API 요청 실패: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }

      const data = await fetchResponse.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('API 호출 오류:', fetchError);

      // 대체 방법: 직접 URL 문자열 구성
      try {
        // 대체 방법으로 URL에 직접 쿼리 파라미터 추가
        const alternativeResponse = await fetch(
          `${apiUrl}/api/v1/projects/${projectId}/apis?include=AI_GENERATED&include=USER_COMPLETED`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!alternativeResponse.ok) {
          throw new Error(`대체 API 요청 실패: ${alternativeResponse.status} ${alternativeResponse.statusText}`);
        }

        const alternativeData = await alternativeResponse.json();
        return NextResponse.json(alternativeData);
      } catch (alternativeError) {
        console.error('대체 API 호출 오류:', alternativeError);
        throw new Error('모든 API 호출 방법이 실패했습니다');
      }
    }
  } catch (error) {
    const apiError = error as Error;
    console.error('API 목록 조회 실패:', apiError);

    return NextResponse.json(
      { error: 'API 목록을 불러오는 중 오류가 발생했습니다: ' + apiError.message },
      { status: 500 }
    );
  }
}
