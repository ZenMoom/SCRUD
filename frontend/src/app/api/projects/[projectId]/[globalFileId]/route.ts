import { NextRequest, NextResponse } from "next/server";
import { ExampleApi, ScrudProjectApi } from "@generated/api";
import { Configuration } from "@generated/configuration";

export async function GET() {
  const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

  const config = new Configuration({
    basePath: apiUrl,
  });
  const exampleApi = new ExampleApi(config);
  
  const response = await exampleApi.getExamplesWithPagination({
    page: 1,
    size: 5,
  });
  return NextResponse.json(response.data);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; globalFileId: string }> }
) {
  try {
    // 프로젝트 ID와 전역파일 ID 파라미터 가져오기
    const { projectId, globalFileId } = await context.params;

    if (!projectId || !globalFileId) {
      return NextResponse.json(
        { message: "프로젝트 ID와 전역 파일 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

    // 인증 토큰 가져오기
    let authorization = request.headers.get('Authorization');

    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json(
        { message: '인증 정보가 필요합니다.' },
        { status: 401 }
      );
    }

    // "Bearer " 접두사 확인 및 필요시 추가
    if (!authorization.startsWith('Bearer ')) {
      authorization = `Bearer ${authorization}`;
    }

    // API 클라이언트 설정 - baseOptions 사용하여 명시적으로 헤더 설정
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        }
      }
    });

    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);

    // API 호출 - 전역 파일 삭제
    await scrudProjectApi.deleteGlobalFile({
      projectId: parseInt(projectId),
      globalFileId: parseInt(globalFileId)
    });

    // 성공적으로 처리되면 204 상태 코드 반환
    return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    console.error('전역 파일 삭제 API 오류:', error);

    let status = 500;
    let message = '서버 오류가 발생했습니다.';

    if (error instanceof Error) {
      console.error('에러 상세 정보:', error);
      // @ts-expect-error - Error 타입에 status 속성이 없지만 런타임에는 존재할 수 있음
      if (error.status) {
        // @ts-expect-error - status 속성에 접근하기 위한 타입 오류 무시
        status = error.status;
      // @ts-expect-error - Error 타입에 response 속성이 없지만 axios 오류는 이 속성을 가짐
      } else if (error.response?.status) {
        // @ts-expect-error - response.status 속성에 접근하기 위한 타입 오류 무시
        status = error.response.status;
      }

      if (status === 400) {
        message = '잘못된 요청입니다.';
      } else if (status === 401 || status === 403) {
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (status === 404) {
        message = '전역 파일을 찾을 수 없습니다.';
      }
    }

    return NextResponse.json({ message }, { status });
  }
}
