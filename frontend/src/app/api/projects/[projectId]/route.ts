import { formatToKST } from '@/util/dayjs';
import { ScrudProjectApi } from '@generated/api';
import { Configuration } from '@generated/configuration';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// GET: 프로젝트 상세 조회 및 전역 설정 파일 목록 조회
export async function GET(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    // 프로젝트 ID 파라미터 가져오기
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ message: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

    // 인증 토큰 가져오기
    let authorization = request.headers.get('Authorization');

    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
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
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
      },
    });

    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);

    // API 호출 - 프로젝트 상세 정보 조회 (전역 설정 파일 포함)
    const response = await scrudProjectApi.getAllGlobalFile({
      projectId: parseInt(projectId),
    });

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(formatToKST(new Date().toISOString()), '프로젝트 상세 조회 API 오류:', error.response?.data);
    }

    let status = 500;
    let message = '서버 오류가 발생했습니다.';

    if (error instanceof Error) {
      console.error(formatToKST(new Date().toISOString()), '에러 상세 정보:', error);
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
        message = '프로젝트를 찾을 수 없습니다.';
      }
    }

    return NextResponse.json({ message }, { status });
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    // 프로젝트 ID 파라미터 가져오기
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ message: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

    // 인증 토큰 가져오기
    let authorization = request.headers.get('Authorization');

    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
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
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
      },
    });

    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);

    // API 호출 - 프로젝트 삭제
    await scrudProjectApi.deleteProject({
      projectId: parseInt(projectId),
    });

    // 성공적으로 삭제된 경우 204 응답 (No Content)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Axios 오류인 경우
      console.error(formatToKST(new Date().toISOString()), '프로젝트 삭제 API 오류:', error.response?.data);
    }

    let status = 500;
    let message = '서버 오류가 발생했습니다.';

    if (error instanceof Error) {
      console.error(formatToKST(new Date().toISOString()), '에러 상세 정보:', error);
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
        message = '프로젝트를 찾을 수 없습니다.';
      }
    }

    return NextResponse.json({ message }, { status });
  }
}

// PUT : 프로젝트 전역 파일 추가
export async function PUT(request: NextRequest, context: { params: Promise<{ projectId: string }> }) {
  try {
    // 프로젝트 ID 파라미터 가져오기
    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ message: '프로젝트 ID가 필요합니다.' }, { status: 400 });
    }

    // 요청 본문 및 헤더 가져오기
    const fileData = await request.json();
    let authorization = request.headers.get('Authorization');

    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }

    // "Bearer " 접두사 확인 및 필요시 추가
    if (!authorization.startsWith('Bearer ')) {
      authorization = `Bearer ${authorization}`;
    }

    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

    // API 클라이언트 설정
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
      },
    });

    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);

    // fileContent가 객체인 경우 JSON 문자열로 직렬화
    if (typeof fileData.fileContent === 'object') {
      fileData.fileContent = JSON.stringify(fileData.fileContent);
    }

    // API 호출
    await scrudProjectApi.addGlobalFile({
      projectId: parseInt(projectId),
      globalFileDto: fileData,
    });

    // 성공적으로 추가된 경우 204 응답 (No Content)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(formatToKST(new Date().toISOString()), '전역 파일 추가 API 오류:', error.response?.data);
    }

    let status = 500;
    let message = '서버 오류가 발생했습니다.';

    if (error instanceof Error) {
      console.error(formatToKST(new Date().toISOString()), '에러 상세 정보:', error);
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
        message = '프로젝트를 찾을 수 없습니다.';
      }
    }

    return NextResponse.json({ message }, { status });
  }
}
