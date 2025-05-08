import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 파일 타입 인터페이스 정의
interface GlobalFile {
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileContent: string;
}

interface ProjectData {
  scrudProjectDto: {
    title: string;
    description: string;
    serverUrl?: string;
  };
  globalFiles: GlobalFile[];
}

interface Settings {
  title: string;
  description: string;
  serverUrl: string;
  requirementSpec: string;
  erd: string;
  dependencyFile: string;
  utilityClass: string;
  errorCode: string;
  securitySetting: string;
  codeConvention: string;
  architectureStructure: string;
  [key: string]: string;
}

// 파일 타입을 백엔드 API의 FileTypeEnumDto와 매핑
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

// POST 요청 처리
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const settings = await request.json() as Settings;
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
    
    // API 요청 데이터 준비 (페이지에서 이동된 로직)
    const globalFiles: GlobalFile[] = [];
    
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
    globalFiles.push({
      fileName: `Architecture-${settings.architectureStructure}`,
      fileType: "ARCHITECTURE_DEFAULT",
      fileUrl: "",
      fileContent: JSON.stringify({ type: settings.architectureStructure })
    });
    
    // 보안 설정 추가
    globalFiles.push({
      fileName: `Security-${settings.securitySetting}`,
      fileType: "SECURITY",
      fileUrl: "",
      fileContent: JSON.stringify({ type: settings.securitySetting })
    });
    
    // 최종 프로젝트 데이터 구성
    const projectData: ProjectData = {
      scrudProjectDto: {
        title: settings.title,
        description: settings.description,
        serverUrl: settings.serverUrl
      },
      globalFiles: globalFiles
    };
    
    // 파일 데이터 검증
    if (globalFiles.length === 0) {
      return NextResponse.json({ message: '최소 하나 이상의 파일이 필요합니다.' }, { status: 400 });
    }
    
    // 백엔드로 요청
    const response = await axios.post('http://localhost:8080/api/v1/projects', projectData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });
    
    // 응답 데이터 가공 (필요한 정보만 추출하여 반환)
    const { id, title, createdAt } = response.data;
    
    return NextResponse.json({ 
      id, 
      title, 
      createdAt,
      message: '프로젝트가 성공적으로 생성되었습니다.' 
    }, { status: 201 });
    
  } catch (error) {
    console.error('프로젝트 생성 API 오류:', error);
    
    // axios 에러 객체에서 응답 정보 추출
    if (axios.isAxiosError(error) && error.response) {
      // 백엔드 오류 메시지를 가공하여 더 사용자 친화적인 메시지로 변환
      let errorMessage = '요청 처리 중 오류가 발생했습니다.';
      
      if (error.response.status === 400) {
        errorMessage = '잘못된 요청 형식입니다. 입력 내용을 확인해주세요.';
      } else if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (error.response.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      return NextResponse.json({ 
        message: errorMessage,
        details: error.response.data
      }, { status: error.response.status });
    }
    
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 