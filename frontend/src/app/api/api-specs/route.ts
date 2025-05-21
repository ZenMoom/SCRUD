import { ApiSpecApi } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { ApiSpecVersionCreateRequest, ApiSpecVersionCreateRequestHttpMethodEnum } from '@generated/model';
import { AxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// API 스펙 생성
export async function POST(request: NextRequest) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authToken = request.headers.get('Authorization');

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

    // API 스펙 생성 요청 준비
    const apiSpecData: ApiSpecVersionCreateRequest = {
      endpoint: body.endpoint,
      httpMethod: body.httpMethod as ApiSpecVersionCreateRequestHttpMethodEnum,
      scrudProjectId: body.scrudProjectId,
      summary: body.summary || '',
      description: body.description || '',
    };

    // 선택적 필드 추가
    if (body.requestBody) {
      apiSpecData.requestBody = body.requestBody;
    }

    if (body.pathParameters) {
      apiSpecData.pathParameters = body.pathParameters;
    }

    if (body.queryParameters) {
      apiSpecData.queryParameters = body.queryParameters;
    }

    if (body.response) {
      apiSpecData.response = body.response;
    }

    // API 스펙 생성 요청
    const response = await apiSpecApi.createApiSpec({
      apiSpecVersionCreateRequest: apiSpecData,
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('API 스펙 생성 오류:', error);

    // 오류 처리
    const errorMessage = error instanceof Error ? error.message : 'API 스펙 생성 중 오류가 발생했습니다.';
    const errorStatus = (error as AxiosError)?.response?.status || 500;

    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
