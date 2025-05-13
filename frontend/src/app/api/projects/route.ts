import { NextRequest, NextResponse } from "next/server";
import { Configuration } from "@generated/configuration";
import { ScrudProjectApi } from "@generated/api";

// 파일 타입 정의
interface FileItem {
  name?: string;
  content?: string;
  [key: string]: unknown;
}

// 파일명에서 경로를 제거하고 순수 파일명만 추출하는 함수
function extractFileName(path: string): string {
  // 경로에서 마지막 슬래시 이후의 부분만 추출
  const lastSlashIndex = Math.max(
    path.lastIndexOf('/'),
    path.lastIndexOf('\\')
  );
  return lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;
}

// GitHub의 파일 내용을 가져오는 함수
async function fetchGitHubFileContent(url: string): Promise<string> {
  try {
    // GitHub API를 통해 파일 내용 가져오기 (raw 컨텐츠 요청)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GitHub 파일 가져오기 실패: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('GitHub 파일 가져오기 오류:', error);
    return JSON.stringify({ error: "GitHub 파일을 가져오는 중 오류가 발생했습니다." });
  }
}

// GitHub 정보에서 raw 컨텐츠 URL 추출
function getRawContentUrl(githubUrl: string): string {
  // 일반 GitHub URL을 raw 콘텐츠 URL로 변환
  if (githubUrl.includes('github.com')) {
    // github.com/username/repo/blob/branch/path 형식을 
    // raw.githubusercontent.com/username/repo/branch/path 형식으로 변환
    return githubUrl
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
  }
  return githubUrl; // 이미 raw URL이거나 다른 형식인 경우 그대로 반환
}

// POST: 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 및 헤더 가져오기
    const settings = await request.json();
    let authorization = request.headers.get('Authorization');
    
    console.log('클라이언트에서 받은 원본 토큰:', authorization);
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      return NextResponse.json({ message: '인증 정보가 필요합니다.' }, { status: 401 });
    }
    
    // "Bearer " 접두사 확인 및 필요시 추가
    if (!authorization.startsWith('Bearer ')) {
      authorization = `Bearer ${authorization}`;
    }
    
    console.log('백엔드로 전송할 토큰:', authorization);
    
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
    const globalFiles: Array<{
      fileName: string;
      fileType: string;
      fileUrl: string;
      fileContent: string;
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
    
    // 특수 파일 타입 매핑 (아키텍처와 보안 설정)
    const specialMappings: Record<string, Record<string, string>> = {
      'architectureStructure': {
        'ARCHITECTURE_DEFAULT_LAYERED_A': 'ARCHITECTURE_DEFAULT_LAYERED_A',
        'ARCHITECTURE_DEFAULT_LAYERED_B': 'ARCHITECTURE_DEFAULT_LAYERED_B',
        'ARCHITECTURE_DEFAULT_HEXAGONAL': 'ARCHITECTURE_DEFAULT_HEXAGONAL',
        'ARCHITECTURE_GITHUB': 'ARCHITECTURE_GITHUB'
      },
      'securitySetting': {
        'SECURITY_DEFAULT_SPRING_SECURITY': 'SECURITY_DEFAULT_SPRING_SECURITY',
        'SECURITY_DEFAULT_SPRING_SECURITY_JWT': 'SECURITY_DEFAULT_SPRING_SECURITY_JWT',
        'SECURITY_DEFAULT_SPRING_SECURITY_OAUTH2': 'SECURITY_DEFAULT_SPRING_SECURITY_OAUTH2'
      }
    };
    
    // 파일 처리 및 GitHub 내용 가져오기 함수
    async function processFiles() {
      const filePromises: Promise<void>[] = [];
      
      // 각 설정 항목 처리
      for (const [key, value] of Object.entries(settings)) {
        // 아키텍처 설정 처리 (기존 로그 제거)
        if (key === 'architectureStructure' && value) {
          if (typeof value === 'string') {
            // GitHub 파일인 경우
            if (value.startsWith('github:')) {
              // github:URL 형식에서 URL 추출
              const githubUrl = value.substring(7);
              const rawUrl = getRawContentUrl(githubUrl);
              const fileName = extractFileName(githubUrl);
              
              const processPromise = async () => {
                // GitHub에서 파일 내용 가져오기
                const fileContent = await fetchGitHubFileContent(rawUrl);
                
                globalFiles.push({
                  fileName: fileName,
                  fileType: 'ARCHITECTURE_GITHUB',
                  fileUrl: "", // fileUrl은 사용하지 않음
                  fileContent: fileContent
                });
              };
              
              filePromises.push(processPromise());
            } else {
              // 기본 아키텍처 옵션인 경우
              globalFiles.push({
                fileName: `Architecture-${value}`,
                fileType: specialMappings.architectureStructure[value as string] || value as string,
                fileUrl: "",
                fileContent: JSON.stringify({ type: value })
              });
            }
          }
        } 
        // 보안 설정 처리 (기존 로그 제거)
        else if (key === 'securitySetting' && value) {
          globalFiles.push({
            fileName: `Security-${value}`,
            fileType: specialMappings.securitySetting[value as string] || value as string,
            fileUrl: "",
            fileContent: JSON.stringify({ type: value })
          });
        }
        // 일반 파일 처리 (기존 로그 제거)
        else if (fileTypeMapping[key]) {
          // 배열로 전달된 파일 처리
          if (Array.isArray(value)) {
            for (const fileItem of value) {
              if (!fileItem) continue;
              
              // 1. fileItem 로그 (기존 로그 변경)
              console.log(`1. 처리 전 fileItem (${key}):`, fileItem);
              
              // GitHub 파일 처리
              if (typeof fileItem === 'string' && fileItem.startsWith('github:')) {
                const githubUrl = fileItem.substring(7);
                const rawUrl = getRawContentUrl(githubUrl);
                const fileName = extractFileName(githubUrl);
                
                const processPromise = async () => {
                  // GitHub에서 파일 내용 가져오기
                  const fileContent = await fetchGitHubFileContent(rawUrl);
                  
                  globalFiles.push({
                    fileName: fileName,
                    fileType: fileTypeMapping[key],
                    fileUrl: "",
                    fileContent: fileContent
                  });
                };
                
                filePromises.push(processPromise());
              }  
              // 객체로 전달된 파일 처리 (로컬 파일)
              else if (typeof fileItem === 'object' && fileItem !== null) {
                // fileItem 객체를 FileItem으로 타입 변환
                const file = fileItem as FileItem;
                const fileName = file.name || "unknown";
                const fileContent = file.content || "";
                
                // 2. 변환 후 값 확인
                console.log('2. 추출 결과:', { fileName, fileContentPreview: fileContent.substring(0, 50) + '...' });
                
                // globalFiles에 추가할 객체
                const fileObj = {
                  fileName: fileName,
                  fileType: fileTypeMapping[key],
                  fileUrl: "",
                  fileContent: fileContent
                };
                
                // 3. globalFiles에 추가하기 전 확인
                console.log('3. globalFiles에 추가할 객체:', fileObj);
                
                globalFiles.push(fileObj);
              } 
              // 문자열로 전달된 파일 처리 (단순 텍스트)
              else {
                globalFiles.push({
                  fileName: extractFileName(String(fileItem)),
                  fileType: fileTypeMapping[key],
                  fileUrl: "",
                  fileContent: String(fileItem)
                });
              }
            }
          }
          // 단일 값 처리
          else if (value) {
            console.log(`[Single] value 타입: ${typeof value}, GitHub 파일 여부: ${typeof value === 'string' && value.startsWith('github:')}`);
            
            // GitHub 파일 처리
            if (typeof value === 'string' && value.startsWith('github:')) {
              const githubUrl = value.substring(7);
              const rawUrl = getRawContentUrl(githubUrl);
              const fileName = extractFileName(githubUrl);
              
              const processPromise = async () => {
                // GitHub에서 파일 내용 가져오기
                const fileContent = await fetchGitHubFileContent(rawUrl);
                
                globalFiles.push({
                  fileName: fileName,
                  fileType: fileTypeMapping[key],
                  fileUrl: "",
                  fileContent: fileContent
                });
              };
              
              filePromises.push(processPromise());
            } 
            // 객체로 전달된 파일 처리 (로컬 파일)
            else if (typeof value === 'object' && value !== null) {
              // value 객체를 FileItem으로 타입 변환
              const file = value as FileItem;
              const fileName = file.name || "unknown";
              const fileContent = file.content || "";
              
              console.log('파일 객체 처리(단일):', { 
                originalName: fileName,
                contentPreview: fileContent.substring(0, 30) + '...'
              });
              
              globalFiles.push({
                fileName: fileName, // 파일 이름만 저장
                fileType: fileTypeMapping[key],
                fileUrl: "",
                fileContent: fileContent // 콘텐츠 내용만 저장
              });
            } 
            // 문자열로 전달된 파일 처리 (단순 텍스트)
            else {
              globalFiles.push({
                fileName: extractFileName(String(value)),
                fileType: fileTypeMapping[key],
                fileUrl: "",
                fileContent: String(value)
              });
            }
          }
        }
      }
      
      // 모든 파일 처리 작업이 완료될 때까지 대기
      await Promise.all(filePromises);
    }
    
    // 비동기 파일 처리 실행
    await processFiles();
    
    // 프로젝트 데이터 구성
    const projectData = {
      scrudProjectDto: {
        title: settings.title,
        description: settings.description,
        serverUrl: settings.serverUrl
      },
      globalFiles
    };
    
    // 최종 전송 데이터 확인
    console.log('최종 전송 데이터의 globalFiles:', globalFiles);
    
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
    
    // API 직접 호출 - 타입 오류를 피하기 위해 ts-expect-error 사용
    // @ts-expect-error - 생성된 API 클라이언트와 타입 호환성 문제 무시
    const response = await scrudProjectApi.createProject({ createProjectRequest: projectData });
    
    return NextResponse.json(response.data, { status: 201 });
    
  } catch (error: unknown) {
    console.error('프로젝트 생성 API 오류:', error);
    
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
    console.log('프로젝트 목록 조회 API 호출 시작');
    
    // API 기본 URL 설정
    const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
    console.log('API URL:', apiUrl);  // API URL 로깅 추가
    
    let authorization = request.headers.get('Authorization');
    
    console.log('Authorization 헤더:', authorization);
    
    // 인증 토큰이 없으면 401 에러 반환
    if (!authorization) {
      console.error('인증 토큰이 없습니다.');
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
    
    console.log('API 설정 완료, 호출 시작');
    
    // ScrudProjectApi 인스턴스 생성
    const scrudProjectApi = new ScrudProjectApi(config);
    
    // API 호출
    const response = await scrudProjectApi.getAllProjects();
    
    console.log('API 호출 성공:', response);
    
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
        console.error('에러 상태 코드:', status);
      // @ts-expect-error - Error 타입에 response 속성이 없지만 axios 오류는 이 속성을 가짐
      } else if (error.response?.status) {
        // @ts-expect-error - response.status 속성에 접근하기 위한 타입 오류 무시
        status = error.response.status;
        console.error('Axios 에러 상태 코드:', status);
        // @ts-expect-error - response.data 속성에 접근하기 위한 타입 오류 무시
        console.error('Axios 에러 응답 데이터:', error.response.data);
      }
      
      if (status === 401 || status === 403) {
        message = '인증에 실패했습니다. 다시 로그인해주세요.';
        console.error('인증 실패:', message);
      } else if (status === 404) {
        message = '프로젝트를 찾을 수 없습니다.';
        console.error('리소스 없음:', message);
      }
    }
    
    return NextResponse.json({ message }, { status });
  }
}