'use client';

import useAuthStore from '@/app/store/useAuthStore';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import type { ApiSpecVersionResponse } from '@generated/model';
// 컴포넌트 임포트
import ApiForm from './ApiForm';
import ApiHeader from './ApiHeader';
import ApiResponse from './ApiResponse';
import LoadingIndicator from './LoadingIndicator';
import BodyTab from './tabs/BodyTab';
import PathParamsTab from './tabs/PathParamsTab';
import QueryParamsTab from './tabs/QueryParamsTab';
import ResponseTab from './tabs/ResponseTab';

// 타입 임포트
import type { ExtendedApiSpecVersionResponse } from '@/types/api-spec';
import type { ApiProcessStateEnumDto } from '@generated/model';
import type { ApiResponseData, BodyParam } from './types';

// 훅 임포트
import { useApiSpec } from './hooks/useApiSpec';
import { useNotification } from './hooks/useNotification';

interface RightContainerProps {
  selectedApi: string | null;
  selectedMethod: string | null;
  onToggleVersionPanel: () => void;
  scrudProjectId: number;
  onApiSpecChanged: () => void;
}

export default function RightContainer({
  selectedApi,
  selectedMethod,
  scrudProjectId,
  onApiSpecChanged,
}: RightContainerProps) {
  // useAuthStore를 컴포넌트 최상위 레벨에서 호출
  const { token } = useAuthStore();

  // 알림 훅 사용
  const { showSuccessNotification, showErrorNotification, showWarningNotification, showInfoNotification } =
    useNotification();

  // 상태 관리
  const [method, setMethod] = useState<string>('GET');
  const [endpoint, setEndpoint] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [apiSpecVersionId, setApiSpecVersionId] = useState<number | null>(null);
  const [apiSpecsList, setApiSpecsList] = useState<ExtendedApiSpecVersionResponse[]>([]);
  const [bodyParams, setBodyParams] = useState<BodyParam[]>([{ key: '', value: '' }]);
  const [activeTab, setActiveTab] = useState<string>('Body');
  const [apiResponse, setApiResponse] = useState<ApiResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiProcessStateEnumDto>('AI_GENERATED');

  // 다이어그램 생성 관련 상태
  const [isCreatingDiagram, setIsCreatingDiagram] = useState<boolean>(false);
  const [diagramProgress, setDiagramProgress] = useState<number>(0);
  const [diagramStep, setDiagramStep] = useState<string>('');

  // Body 관련 상태
  const [bodyMode, setBodyMode] = useState<'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary'>('raw');
  const [rawBodyFormat, setRawBodyFormat] = useState<'json' | 'text' | 'xml' | 'javascript' | 'html'>('json');
  const [rawBody, setRawBody] = useState<string>('');

  // 파라미터 상태 - 기본값을 빈 문자열로 변경
  const [pathParamsJson, setPathParamsJson] = useState<string>('');
  const [queryParamsJson, setQueryParamsJson] = useState<string>('');
  const [responseJson, setResponseJson] = useState<string>('');

  // API 스펙 목록 조회 함수
  const fetchApiSpecsByProject = useCallback(
    async (projectId: number): Promise<ApiSpecVersionResponse[]> => {
      setIsLoading(true);
      try {
        // 백엔드에서 API 스펙 목록 조회 - 토큰을 콜백 밖에서 가져온 것 사용
        const response = await axios.get<{ content: ApiSpecVersionResponse[] }>(
          `/api/api-specs/by-project/${projectId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          }
        );

        // 응답 처리
        const specsList = response.data.content || [];
        setApiSpecsList(specsList);

        return specsList;
      } catch {
        alert('API 스펙 목록을 가져오는 중 오류가 발생했습니다.');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  // 다이어그램 생성 진행 시뮬레이션
  useEffect(() => {
    if (!isCreatingDiagram) return;

    const steps = [
      { progress: 10, message: 'API 데이터 분석 중...' },
      { progress: 30, message: '다이어그램 구조 생성 중...' },
      { progress: 50, message: '클래스 관계 매핑 중...' },
      { progress: 70, message: '메서드 및 속성 처리 중...' },
      { progress: 90, message: '다이어그램 렌더링 중...' },
    ];

    let currentStepIndex = 0;
    const stepInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setDiagramProgress(step.progress);
        setDiagramStep(step.message);
        currentStepIndex++;
      } else {
        clearInterval(stepInterval);
      }
    }, 800);

    return () => {
      clearInterval(stepInterval);
    };
  }, [isCreatingDiagram]);

  // API 상태 변경 함수
  const updateApiStatus = async (
    projectId: string | number,
    apiId: string | number,
    status: ApiProcessStateEnumDto
  ) => {
    try {
      // 새로운 코드 (api-specs/api 엔드포인트 사용)
      const response = await axios.patch(
        `/api/api-specs/api/${apiId}`,
        {
          apiSpecStatus: status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}` || '',
          },
        }
      );
      setApiStatus(status);
      return response.data;
    } catch {
      alert('API 상태를 변경하는 중 오류가 발생했습니다.');
    }
  };

  // 다이어그램 생성 핸들러
  const handleCreateDiagram = async () => {
    if (!apiSpecVersionId) {
      showWarningNotification('API를 먼저 저장해주세요.');
      return;
    }

    setIsCreatingDiagram(true);
    setDiagramProgress(0);
    setDiagramStep('다이어그램 생성 준비 중...');

    try {
      await fetch(`/api/canvas/${scrudProjectId}/${apiSpecVersionId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}` || '',
        },
      });

      // 다이어그램 생성 완료 표시
      setDiagramProgress(100);
      setDiagramStep('다이어그램 생성 완료');

      try {
        // API 상태 변경 (AI_GENERATED -> AI_VISUALIZED)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 수정된 API 상태 변경 함수 호출
        await updateApiStatus(scrudProjectId, apiSpecVersionId, 'AI_VISUALIZED');

        // 성공 메시지
        showSuccessNotification('다이어그램이 성공적으로 생성되었습니다.');
      } catch {
        alert('API 상태 변경 중 오류가 발생했습니다.');
        showWarningNotification('다이어그램은 생성되었지만 API 상태 변경에 실패했습니다.');
      }

      // 목록 새로고침
      onApiSpecChanged();
    } catch {
      alert('다이어그램 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreatingDiagram(false);
    }
  };

  const handleCancelDiagramCreation = () => {
    setIsCreatingDiagram(false);
    setDiagramProgress(0);
    setDiagramStep('');
  };

  // selectedApi와 selectedMethod가 변경될 때 호출되는 효과
  useEffect(() => {
    if (selectedApi) {
      setEndpoint(selectedApi);

      // selectedMethod가 있으면 해당 메서드로 설정
      if (selectedMethod) {
        setMethod(selectedMethod);
      }

      // API 경로에 따른 설명 설정
      if (selectedApi.includes('/user/me')) {
        setDescription('현재 인증된 사용자의 개인 정보를 조회하는 API');
        setSummary('사용자 정보 조회');

        // 경로 파라미터 예시 - 경로에 {parameter}가 있을 때만 설정
        if (selectedApi.includes('{')) {
          setPathParamsJson('{ "userId": "123" }');
        } else {
          setPathParamsJson('');
        }

        // GET 메서드는 기본적으로 body가 없음
        if (selectedMethod === 'GET') {
          setBodyMode('none');
          setRawBody('');
          setQueryParamsJson('{ "fields": "name,email,profile" }');
        } else {
          // POST/PUT은 JSON 바디 예시 설정
          setBodyMode('raw');
          setRawBody('{\n  "name": "홍길동",\n  "email": "user@example.com"\n}');
        }
      } else if (selectedApi.includes('/user/login')) {
        setDescription('사용자 로그인 API');
        setSummary('로그인');
        setRawBody('{\n  "username": "user@example.com",\n  "password": "password123"\n}');
      } else if (selectedApi.includes('/user/logout')) {
        setDescription('사용자 로그아웃 API');
        setSummary('로그아웃');
        setRawBody('');
      } else if (selectedApi.includes('/post/send')) {
        setDescription('게시물 전송 API');
        setSummary('게시물 전송');
        setRawBody('{\n  "title": "새 게시물",\n  "content": "게시물 내용입니다."\n}');
      } else if (selectedApi.includes('/post/delete')) {
        setDescription('게시물 삭제 API');
        setSummary('게시물 삭제');
        setRawBody('{\n  "postId": 123\n}');
      } else if (selectedApi.includes('/post/update')) {
        setDescription('게시물 수정 API');
        setSummary('게시물 수정');
        setRawBody('{\n  "postId": 123,\n  "title": "수정된 제목",\n  "content": "수정된 내용"\n}');
      } else {
        // 기본 설정
        setDescription('');
        setSummary(selectedApi.split('/').pop() || 'API');

        // 기본값 설정 - 빈 문자열로 초기화
        setRawBody('');
        setPathParamsJson('');
        setQueryParamsJson('');
        setResponseJson('{\n  "message": "성공"\n}');
      }

      // GET 메서드인 경우 body mode를 none으로 설정
      if (selectedMethod === 'GET') {
        setBodyMode('none');
      } else {
        setBodyMode('raw');
        setRawBodyFormat('json');
      }

      // 새 API 선택 시 ID 초기화
      setApiSpecVersionId(null);
      setApiStatus('AI_GENERATED'); // 기본 상태 설정
    }
  }, [selectedApi, selectedMethod]);

  // 프로젝트 ID가 변경될 때 API 스펙 목록 가져오기
  useEffect(() => {
    if (scrudProjectId > 0) {
      fetchApiSpecsByProject(scrudProjectId).catch(() => alert('API 스펙 목록을 가져오는 중 오류가 발생했습니다.'));
    }
  }, [scrudProjectId, fetchApiSpecsByProject]);

  // selectedApi와 selectedMethod가 변경될 때 apiSpecVersionId를 설정하는 useEffect
  useEffect(() => {
    if (selectedApi && selectedMethod) {
      // 선택된 API에 해당하는 API 스펙 찾기
      const foundSpec = apiSpecsList.find(
        (spec) => spec.endpoint === selectedApi && spec.httpMethod === selectedMethod
      );

      if (foundSpec) {
        // API 스펙 ID 설정
        setApiSpecVersionId(foundSpec.apiSpecVersionId || null);
        setEndpoint(foundSpec.endpoint || '');
        setMethod(foundSpec.httpMethod || 'GET');
        setDescription(foundSpec.description || '');
        setSummary(foundSpec.summary || '');

        // API 상태 설정
        const status = foundSpec.apiSpecStatus || ('AI_GENERATED' as ApiProcessStateEnumDto);
        setApiStatus(status);

        // requestBody 설정 - null이면 빈 문자열 설정
        if (foundSpec.requestBody) {
          setRawBody(foundSpec.requestBody);
          setBodyMode('raw');
          setRawBodyFormat('json');
        } else {
          setRawBody('');
          if (foundSpec.httpMethod === 'GET') {
            setBodyMode('none');
          } else {
            setBodyMode('raw');
          }
        }

        // pathParameters 설정 - null이면 빈 문자열 설정
        if (foundSpec.pathParameters) {
          setPathParamsJson(foundSpec.pathParameters);
        } else {
          setPathParamsJson('');
        }

        // queryParameters 설정 - null이면 빈 문자열 설정
        if (foundSpec.queryParameters) {
          setQueryParamsJson(foundSpec.queryParameters);
        } else {
          setQueryParamsJson('');
        }

        // response 설정 - null이면 빈 문자열 설정
        if (foundSpec.response) {
          setResponseJson(foundSpec.response);
        } else {
          setResponseJson('');
        }
      } else {
        // 새 API 생성 모드
        setApiSpecVersionId(null);
        setEndpoint(selectedApi);
        setMethod(selectedMethod);
        setApiStatus('AI_GENERATED' as ApiProcessStateEnumDto); // 기본 상태 설정
      }
    }
  }, [selectedApi, selectedMethod, apiSpecsList]);

  // JSON 형식 검사 및 포맷팅
  const formatJson = (jsonStr: string, setter: (formatted: string) => void) => {
    // 빈 문자열이면 처리하지 않음
    if (!jsonStr.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      setter(JSON.stringify(parsed, null, 2));
    } catch {
      alert('유효하지 않은 JSON 형식입니다.');
    }
  };

  // API 조작 핸들러
  const { handleSaveApi, handleDeleteApi } = useApiSpec({
    endpoint,
    method,
    summary,
    description,
    scrudProjectId,
    apiSpecVersionId,
    bodyMode,
    rawBodyFormat,
    rawBody,
    bodyParams,
    pathParamsJson,
    queryParamsJson,
    responseJson,
    setApiSpecVersionId,
    setEndpoint,
    setDescription,
    setSummary,
    setRawBody,
    setPathParamsJson,
    setQueryParamsJson,
    setResponseJson,
    setApiResponse,
    setIsLoading,
    fetchApiSpecsByProject,
    onApiSpecChanged,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
  });

  return (
    <div className='flex flex-col h-full overflow-auto bg-white'>
      {/* 헤더 영역 */}
      <ApiHeader
        scrudProjectId={scrudProjectId}
        apiSpecVersionId={apiSpecVersionId}
        isLoading={isLoading}
        isCreatingDiagram={isCreatingDiagram}
        diagramCreationProgress={diagramProgress}
        diagramCreationStep={diagramStep}
        apiStatus={apiStatus}
        handleSaveApi={handleSaveApi}
        handleDeleteApi={handleDeleteApi}
        handleCreateDiagram={handleCreateDiagram}
        handleCancelDiagramCreation={handleCancelDiagramCreation}
      />

      {/* 기본 정보 입력 영역 */}
      <ApiForm
        summary={summary}
        setSummary={setSummary}
        method={method}
        setMethod={setMethod}
        endpoint={endpoint}
        setEndpoint={setEndpoint}
        description={description}
        setDescription={setDescription}
      />

      {/* 탭 영역 */}
      <div className='flex text-sm bg-white border-b'>
        <button
          className={`px-4 py-2 ${activeTab === 'Body' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('Body')}
        >
          Request Body
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'Path' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('Path')}
        >
          Path 파라미터
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'Query' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('Query')}
        >
          Query 파라미터
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'Response' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
          onClick={() => setActiveTab('Response')}
        >
          Response
        </button>
      </div>

      {/* 탭 내용 영역 */}
      <div className='p-4'>
        {activeTab === 'Body' && (
          <BodyTab
            bodyMode={bodyMode}
            setBodyMode={setBodyMode}
            method={method}
            rawBodyFormat={rawBodyFormat}
            setRawBodyFormat={setRawBodyFormat}
            rawBody={rawBody}
            setRawBody={setRawBody}
            formatJson={formatJson}
            bodyParams={bodyParams}
            setBodyParams={setBodyParams}
          />
        )}

        {activeTab === 'Path' && (
          <PathParamsTab
            pathParamsJson={pathParamsJson}
            setPathParamsJson={setPathParamsJson}
            formatJson={formatJson}
            endpoint={endpoint}
          />
        )}

        {activeTab === 'Query' && (
          <QueryParamsTab
            queryParamsJson={queryParamsJson}
            setQueryParamsJson={setQueryParamsJson}
            formatJson={formatJson}
          />
        )}

        {activeTab === 'Response' && (
          <ResponseTab
            responseJson={responseJson}
            setResponseJson={setResponseJson}
            formatJson={formatJson}
          />
        )}
      </div>

      {/* 응답 결과 영역 */}
      {apiResponse && <ApiResponse apiResponse={apiResponse} />}

      {/* 로딩 인디케이터 */}
      {isLoading && <LoadingIndicator />}
    </div>
  );
}
