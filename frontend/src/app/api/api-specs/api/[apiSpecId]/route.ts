import { ApiSpecApi } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { ApiSpecVersionStatusRequest, ApiSpecVersionStatusRequestApiSpecStatusEnum } from '@generated/model';
import { AxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// API 스펙 상태 업데이트
export async function PATCH(request: NextRequest, context: { params: Promise<{ apiSpecId: string }> }) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authToken = request.headers.get('Authorization');
    console.log(authToken);

    const params = await context.params;
    const apiSpecId = Number(params.apiSpecId);

    if (isNaN(apiSpecId)) {
      return NextResponse.json({ error: '유효하지 않은 API 스펙 ID입니다.' }, { status: 400 });
    }

    // 클라이언트에서 전송한 데이터 파싱
    const body = await request.json();

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

    // API 스펙 상태 업데이트 요청 준비
    const apiSpecVersionStatusRequest: ApiSpecVersionStatusRequest = {
      apiSpecStatus: body.apiSpecStatus as ApiSpecVersionStatusRequestApiSpecStatusEnum,
    };

    // API 스펙 상태 업데이트 요청
    const requestParameters = {
      apiSpecId,
      apiSpecVersionStatusRequest,
    };

    const response = await apiSpecApi.updateApiSpecStatus(requestParameters);
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('API 스펙 상태 업데이트 오류:', error);

    // 오류 상세 정보 로깅
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // 오류 처리
    const errorMessage = error instanceof Error ? error.message : 'API 스펙 상태 업데이트 중 오류가 발생했습니다.';
    const errorStatus = (error as AxiosError)?.response?.status || 500;

    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
