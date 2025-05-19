import { NextRequest, NextResponse } from "next/server";
import { Configuration } from "@generated/configuration";
import { ScrudProjectApi } from "@generated/api";

// 파일 타입 정의
interface FileWithContent {
  name?: string;
  fileName?: string;
  content: string | Record<string, unknown>;  // GitHub API 응답을 포함할 수 있도록 수정
  isGitHub?: boolean;
  path?: string;
  fileType?: string;
}

// 선택형 입력을 위한 타입 추가
interface SelectionValue {
  type: string;
  label: string;
  name?: string;
  content?: string;
}

// POST: 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const settings = await request.json();
    let authorization = request.headers.get('Authorization');
    
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }
    
    // "Bearer " 접두사 확인 및 필요시 추가
    if (!authorization.startsWith('Bearer ')) {
      authorization = `Bearer ${authorization}`;
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
    console.log('API URL:', apiUrl);
    
    // 글로벌 파일 준비
    const globalFiles: Array<{
      fileName: string;
      fileType: string;
      fileUrl: string;
      fileContent: string | Record<string, unknown>;  // string 또는 객체를 허용
    }> = [];
    
    // 파일 타입 매핑 
    const fileTypeMapping: Record<string, string> = {
      'requirementSpec': 'REQUIREMENTS',
      'erd': 'ERD',
      'utilityClass': 'UTIL',
      'codeConvention': 'CONVENTION',
      'dependencyFile': 'DEPENDENCY',
      'errorCode': 'ERROR_CODE'
    };
    
    // 파일 타입 항목들 추가
    Object.entries(settings).forEach(([key, value]) => {
      // 아키텍처와 보안 설정 특별 처리
      if (key === 'architectureStructure') {
        console.log('\n=== 아키텍처 처리 시작 ===');
        console.log('받은 key:', key);
        console.log('받은 value 전체:', value);
        const architectureValue = value as SelectionValue | FileWithContent[];
        console.log('route.ts 받은 architectureStructure value:', JSON.stringify(architectureValue, null, 2));
        
        if (architectureValue) {
          if (Array.isArray(architectureValue)) {
            // GitHub에서 가져온 파일 처리
            console.log('\n=== 아키텍처 GitHub 처리 시작 ===');
            console.log('GitHub 파일 배열 길이:', architectureValue.length);
            architectureValue.forEach((file, index) => {
              console.log(`\n[GitHub 파일 ${index + 1} 처리]`);
              console.log('파일명:', file.fileName || file.name || 'unnamed_file');
              console.log('content:', file.content);

              globalFiles.push({
                fileName: file.fileName || file.name || 'unnamed_file',
                fileType: 'ARCHITECTURE_GITHUB',
                fileUrl: "",
                fileContent: file.content
              });
            });
            console.log('\n=== 아키텍처 GitHub 처리 완료 ===');
          } else if (architectureValue.type && architectureValue.type.startsWith('ARCHITECTURE_DEFAULT_')) {
            console.log('\n=== 아키텍처 선택지 처리 시작 ===');
            console.log('선택된 아키텍처 타입:', architectureValue.type);
            
            globalFiles.push({
              fileName: `${architectureValue.type}`,
              fileType: architectureValue.type,
              fileUrl: "",
              fileContent: ""
            });
            console.log('\n=== 아키텍처 선택지 처리 완료 ===');
          }
        }
        console.log('\n=== 아키텍처 처리 완료 ===');
        console.log('최종 globalFiles 길이:', globalFiles.length);
      }
      else if (key === 'securitySetting') {
        console.log('\n=== route.ts 보안 설정 처리 시작 ===');
        console.log('받은 key:', key);
        console.log('받은 value:', value);
        
        const securityValue = value as SelectionValue | FileWithContent[];
        if (securityValue) {
          console.log('securityValue 타입:', Array.isArray(securityValue) ? '파일 배열' : '선택 타입');
          
          if (Array.isArray(securityValue)) {
            // 일반 파일 업로드 처리
            if (securityValue.length > 0 && !securityValue[0].isGitHub) {
              console.log('일반 파일 업로드 처리:', securityValue);
              securityValue.forEach(file => {
                globalFiles.push({
                  fileName: file.name || 'security_file.txt',
                  fileType: 'SECURITY',
                  fileUrl: '',
                  fileContent: file.content
                });
              });
            }
            // GitHub에서 가져온 파일 처리
            else if (securityValue.length > 0 && securityValue[0].isGitHub) {
              console.log('GitHub 파일 처리:', securityValue);
              securityValue.forEach(file => {
                globalFiles.push({
                  fileName: file.name || 'security_file.txt',
                  fileType: 'SECURITY',
                  fileUrl: "",
                  fileContent: file.content
                });
              });
            }
          } else {
            console.log('선택 타입 처리:', securityValue);
            // 선택된 보안 타입 처리
            globalFiles.push({
              fileName: `${securityValue.type}`,
              fileType: securityValue.type,
              fileUrl: "",
              fileContent: ""
            });
          }
        }
        console.log('=== route.ts 보안 설정 처리 완료 ===\n');
      }
      // 의존성 파일 처리
      else if (key === 'dependencyFile') {
        console.log('\n=== 의존성 파일 처리 시작 ===');
        const files = value as Array<{ name: string; content: string }>;
        console.log("의존성 파일 받은 거 있나?", files)
        files.forEach(file => {
          globalFiles.push({
            fileName: file.name,
            fileType: 'DEPENDENCY',
            fileUrl: '',
            fileContent: file.content
          });
        });
        
        console.log('처리된 의존성 파일 수:', files.length);
        console.log('=== 의존성 파일 처리 완료 ===\n');
      }
      // GitHub 파일 처리
      else if (Array.isArray(value) && value.length > 0 && value[0].isGitHub === true) {
        const files = value as Array<FileWithContent>;
        files.forEach(file => {
          console.log('GitHub 파일 처리:', file);
          globalFiles.push({
            fileName: file.name || 'unnamed_github_file',
            fileType: fileTypeMapping[key],
            fileUrl: "",
            fileContent: file.content
          });
        });
      }
      // 일반 파일 처리
      else if (fileTypeMapping[key]) {
        const files = value as Array<FileWithContent>;
        if (Array.isArray(files)) {
          files.forEach(file => {
            console.log('일반 파일 처리:', file);
            globalFiles.push({
              fileName: file.name || 'unnamed_file',
              fileType: fileTypeMapping[key],
              fileUrl: "",
              fileContent: file.content
            });
          });
        }
      }
    });

    console.log('변환된 globalFiles:', globalFiles);
    
    // 프로젝트 데이터 구성
    const projectData = {
      scrudProjectDto: {
        title: settings.title,
        description: settings.description,
        serverUrl: settings.serverUrl
      },
      globalFiles
    };
    
    console.log('백엔드로 전송할 projectData:', projectData);

    // API 클라이언트 설정
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        }
      }
    });
    
    console.log('API 설정:', config);
    
    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);
    
    try {
      // API 호출
      // @ts-expect-error - 생성된 API 클라이언트와 타입 호환성 문제 무시
      const response = await scrudProjectApi.createProject({ createProjectRequest: projectData });
      console.log('API 응답:', response);
      return NextResponse.json(response.data, { status: 201 });
    } catch (apiError) {
      console.error('API 호출 중 에러:', apiError);
      throw apiError;
    }
    
  } catch (error: unknown) {
    console.error('프로젝트 생성 API 오류:', error);
    
    if (error instanceof Error) {
      console.error('에러 상세 정보:', error );
    }
    
    let status = 500;
    let message = '서버 오류가 발생했습니다.';
    
    if (error instanceof Error) {
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
        message = '잘못된 요청 형식입니다. 입력 내용을 확인해주세요.';
      } else if (status === 401 || status === 403) {
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
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
    let authorization = request.headers.get('Authorization');
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }
    
    // "Bearer " 접두사 확인 및 필요시 추가
    if (!authorization.startsWith('Bearer ')) {
      authorization = `Bearer ${authorization}`;
    }
    
    console.log('백엔드로 전송할 토큰:', authorization);
    
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
    
    // API 호출
    const response = await scrudProjectApi.getAllProjects();
    
    return NextResponse.json(response.data);
    
  } catch (error: unknown) {
    console.error('프로젝트 조회 API 오류:', error);
    
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
      
      if (status === 401 || status === 403) {
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (status === 404) {
        message = '프로젝트를 찾을 수 없습니다.';
      }
    }
    
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const updateData = await request.json();
    console.log('PATCH 함수로 전달받은 데이터:', updateData);
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
          'Authorization': authorization,
          'Content-Type': 'application/json'
        }
      }
    });

    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);
    
    // API 호출
    const response = await scrudProjectApi.updateScrudProject({
      scrudProjectDto: {
        scrudProjectId: updateData.scrudProjectId,
        title: updateData.title,
        description: updateData.description,
        serverUrl: updateData.serverUrl
      }
    });
    
    return NextResponse.json(response.data);
    
  } catch (error: unknown) {
    console.error('프로젝트 수정 API 오류:', error);
    
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
        message = '잘못된 요청입니다. 입력 내용을 확인해주세요.';
      } else if (status === 401 || status === 403) {
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (status === 404) {
        message = '프로젝트를 찾을 수 없습니다.';
      }
    }
    
    return NextResponse.json({ message }, { status });
  }
}
