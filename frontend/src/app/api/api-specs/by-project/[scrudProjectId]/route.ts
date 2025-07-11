import { ApiSpecApi } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ scrudProjectId: string }> }) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authToken = request.headers.get('Authorization');

    const params = await context.params;
    const scrudProjectId = Number(params.scrudProjectId);

    if (isNaN(scrudProjectId)) {
      return NextResponse.json({ error: '유효하지 않은 프로젝트 ID입니다.' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: authToken
          ? {
              Authorization: `${authToken}`,
            }
          : undefined,
      },
    });
    const apiSpecApi = new ApiSpecApi(config);

    const response = await apiSpecApi.getApiSpecsByScrudProjectId({
      scrudProjectId,
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('API 스펙 목록 조회 오류:', error);

    const errorMessage = error instanceof Error ? error.message : 'API 스펙 목록 조회 중 오류가 발생했습니다.';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
