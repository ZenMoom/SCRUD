import { NextRequest, NextResponse } from "next/server";
import { Configuration } from "@generated/configuration";
import { ScrudProjectApi } from "@generated/api";

// POST: 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const settings = await request.json();
    const authorization = request.headers.get('Authorization');
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }
    
    // 데이터 검증 - 필수 필드 확인
    if (!settings.title || !settings.description) {
      return NextResponse.json({ message: '프로젝트 제목과 설명은 필수 항목입니다.' }, { status: 400 });
    }
    
    if (!settings.requirementSpec || !settings.erd) {
      return NextResponse.json({ 
        message: '요구사항 명세서와 ERD는 필수 항목입니다.' 
      }, { status: 400 });
    }
    
    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    
    // 글로벌 파일 준비
    const globalFiles = [];
    
    // 파일 타입 매핑 
    const fileTypeMapping: Record<string, string> = {
      'requirementSpec': 'REQUIREMENTS',
      'erd': 'ERD',
      'utilityClass': 'UTIL',
      'codeConvention': 'CONVENTION',
      'dependencyFile': 'DEPENDENCY',
      'errorCode': 'ERROR_CODE',
      'securitySetting': 'SECURITY',
      'architectureStructure': 'ARCHITECTURE_DEFAULT'
    };
    
    // 파일 타입 항목들 추가
    Object.entries(settings).forEach(([key, value]) => {
      if (fileTypeMapping[key] && value) {
        globalFiles.push({
          fileName: value,
          fileType: fileTypeMapping[key],
          fileUrl: "",
          fileContent: JSON.stringify({ content: value })
        });
      }
    });
    
    // 아키텍처 구조 추가
    const architectureFileType = 
      settings.architectureStructure.startsWith('github:') 
        ? 'ARCHITECTURE_GITHUB' 
        : 'ARCHITECTURE_DEFAULT';
    
    globalFiles.push({
      fileName: `Architecture-${settings.architectureStructure}`,
      fileType: architectureFileType,
      fileUrl: "",
      fileContent: JSON.stringify({ type: settings.architectureStructure })
    });
    
    // 보안 설정 추가
    globalFiles.push({
      fileName: `Security-${settings.securitySetting}`,
      fileType: 'SECURITY',
      fileUrl: "",
      fileContent: JSON.stringify({ type: settings.securitySetting })
    });
    
    // 프로젝트 데이터 구성
    const createProjectRequest = {
      scrudProjectDto: {
        title: settings.title,
        description: settings.description,
        serverUrl: settings.serverUrl
      },
      globalFiles
    };
    
    // API 클라이언트 설정
    const config = new Configuration({
      basePath: apiUrl,
      headers: {
        'Authorization': authorization
      }
    });
    
    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);
    
    // API 호출
    const response = await scrudProjectApi.createProject(createProjectRequest);
    
    return NextResponse.json(response.data, { status: 201 });
    
  } catch (error: unknown) {
    console.error('프로젝트 생성 API 오류:', error);
    
    let status = 500;
    let message = '서버 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if ('status' in error) {
        status = (error as any).status;
        
        if (status === 400) {
          message = '잘못된 요청 형식입니다. 입력 내용을 확인해주세요.';
        } else if (status === 401 || status === 403) {
          message = '인증에 실패했습니다. 다시 로그인해주세요.';
        }
      }
    }
    
    return NextResponse.json({ message }, { status });
  }
}

// GET: 프로젝트 전체 목록 조회
export async function GET(request: NextRequest) {
  try {
    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    const authorization = request.headers.get('Authorization');
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }
    
    // URL에서 페이지네이션 파라미터 추출
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '10');
    
    // API 클라이언트 설정
    const config = new Configuration({
      basePath: apiUrl,
      headers: {
        'Authorization': authorization
      }
    });
    
    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);
    
    // API 호출 (페이지네이션 포함)
    const response = await scrudProjectApi.getAllProjects({
      page: page,
      size: size
    });
    
    return NextResponse.json(response.data);
    
  } catch (error: unknown) {
    console.error('프로젝트 조회 API 오류:', error);
    
    let status = 500;
    let message = '서버 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if ('status' in error) {
        status = (error as any).status;
        
        if (status === 401 || status === 403) {
          message = '인증에 실패했습니다. 다시 로그인해주세요.';
        } else if (status === 404) {
          message = '프로젝트를 찾을 수 없습니다.';
        }
      }
    }
    
    return NextResponse.json({ message }, { status });
  }
}