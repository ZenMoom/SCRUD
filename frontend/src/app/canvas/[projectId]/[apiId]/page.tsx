'use client';

/**
 * 이 페이지는 클라이언트 컴포넌트입니다.
 * 모든 React Hooks는 컴포넌트의 최상위 레벨에서 호출되어야 합니다.
 */

import type { TargetNode } from '@/components/canvas/DiagramContainer';
import type { ChatHistoryResponse, DiagramResponse } from '@generated/model';
import axios from 'axios';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// 컴포넌트 임포트
import useAuthStore from '@/app/store/useAuthStore';
import ChatContainer from '@/components/canvas/ChatContainer';
import DiagramContainer from '@/components/canvas/DiagramContainer';
import DtoContainer from '@/components/canvas/DtoContainer';

// API 목록 아이템 타입 정의
interface ApiListItem {
  apiId: string;
  name: string;
  status: string;
  description?: string;
  endpoint?: string; // Add this line to include endpoint information
}

// 버전 정보 타입 정의
interface VersionInfo {
  versionId: string;
  description: string;
  timestamp: string;
}

// 사이드 패널 탭 타입 정의
type SidePanelTab = 'api' | 'dto';

export default function CanvasPage() {
  // token
  const { token } = useAuthStore();

  // 라우터 및 파라미터 가져오기
  const searchParams = useSearchParams();
  const params = useParams();

  // URL 파라미터 추출
  const projectId = params.projectId as string;
  const apiId = params.apiId as string;

  // 쿼리 파라미터에서 버전 ID 가져오기
  const versionParam = searchParams.get('version');

  // 다이어그램 데이터 상태
  const [diagramData, setDiagramData] = useState<DiagramResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 채팅 데이터 상태
  const [chatData, setChatData] = useState<ChatHistoryResponse | null>(null);
  const [chatLoading, setChatLoading] = useState<boolean>(true);
  const [chatError, setChatError] = useState<string | null>(null);

  // 버전 관련 상태
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(versionParam);

  // 새 버전 감지를 위한 ref
  const latestVersionRef = useRef<string | null>(null);

  // API 목록 데이터 상태
  const [apiListVisible, setApiListVisible] = useState<boolean>(false);
  const [apiListData, setApiListData] = useState<ApiListItem[]>([]);
  const [apiListLoading, setApiListLoading] = useState<boolean>(false);
  const [apiListError, setApiListError] = useState<string | null>(null);

  // 사이드 패널 탭 상태
  const [activeTab, setActiveTab] = useState<SidePanelTab>('api');

  // 타겟 노드 상태
  const [targetNodes, setTargetNodes] = useState<TargetNode[]>([]);

  // Add this after the other state declarations
  const [currentApiEndpoint, setCurrentApiEndpoint] = useState<string | undefined>(undefined);

  // 상태 변수 추가 - showCompletionAlert 아래에 추가
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showCompletedMessage, setShowCompletedMessage] = useState<boolean>(false);

  // 채팅 데이터 가져오기 함수
  const fetchChatData = useCallback(async () => {
    if (!projectId || !apiId) return;

    try {
      setChatLoading(true);
      setChatError(null);

      // axios를 사용하여 채팅 API 호출
      const response = await axios.get<ChatHistoryResponse>(`/api/chat/${projectId}/${apiId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChatData(response.data);
      console.log('채팅 데이터:', response.data);
    } catch (err) {
      console.error('채팅 데이터 가져오기 오류:', err);

      if (axios.isAxiosError(err)) {
        setChatError(err.response?.data?.error || err.message);
      } else {
        setChatError('채팅 데이터를 가져오는 중 오류가 발생했습니다.');
      }
    } finally {
      setChatLoading(false);
    }
  }, [projectId, apiId, token]);

  // 페이지 로드 시 채팅 데이터 먼저 가져오기
  useEffect(() => {
    if (projectId && apiId) {
      fetchChatData();
    }
  }, [projectId, apiId, fetchChatData]);

  // 채팅 데이터에서 버전 정보 추출
  useEffect(() => {
    if (chatData && chatData.content) {
      // 채팅 내역에서 버전 정보 추출
      const extractedVersions: VersionInfo[] = [];

      // 버전 1은 항상 기본으로 추가 (채팅 내역에 없더라도)
      extractedVersions.push({
        versionId: '1',
        description: '초기 버전',
        timestamp: new Date().toISOString(),
      });

      chatData.content.forEach((item) => {
        if (item.systemChat?.versionInfo) {
          const { newVersionId, description } = item.systemChat.versionInfo;

          // null/undefined 체크 및 기본값 설정
          const versionId = newVersionId || '';
          const versionDesc = description || '버전 설명 없음';

          // 중복 버전 체크 (버전 1은 이미 추가했으므로 중복 체크)
          if (versionId && !extractedVersions.some((v) => v.versionId === versionId)) {
            extractedVersions.push({
              versionId: versionId,
              description: versionDesc,
              timestamp: item.createdAt,
            });
          }
        }
      });

      // 버전 ID를 숫자로 변환하여 오름차순 정렬 (1, 2, 3, ...)
      extractedVersions.sort((a, b) => {
        const aNum = Number.parseInt(a.versionId, 10) || 0;
        const bNum = Number.parseInt(b.versionId, 10) || 0;
        return aNum - bNum;
      });

      setVersions(extractedVersions);

      // 최신 버전 ID 저장
      if (extractedVersions.length > 0) {
        const latestVersion = extractedVersions[extractedVersions.length - 1];
        latestVersionRef.current = latestVersion.versionId;
      }

      // URL에서 버전 파라미터가 있는 경우 해당 버전 선택
      if (versionParam) {
        setSelectedVersion(versionParam);
      } else if (extractedVersions.length > 0) {
        // 버전 파라미터가 없고 버전이 있는 경우 가장 최신 버전 선택
        const latestVersion = extractedVersions[extractedVersions.length - 1];
        setSelectedVersion(latestVersion.versionId);

        // URL 업데이트 대신 전체 페이지 새로고침 사용
        if (projectId && apiId) {
          window.location.href = `/canvas/${projectId}/${apiId}?version=${latestVersion.versionId}`;
        }
      }
    }
  }, [chatData, versionParam, projectId, apiId]);

  // 다이어그램 데이터 가져오기 함수 - 버전 ID를 파라미터로 받음
  const fetchDiagramData = useCallback(
    async (versionId: string) => {
      if (!projectId || !apiId) return;

      try {
        setLoading(true);
        setError(null);

        // axios를 사용하여 API 호출 - 버전 ID를 쿼리 파라미터로 전달
        const response = await axios.get<DiagramResponse>(`/api/canvas/${projectId}/${apiId}?version=${versionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 응답 데이터 검증 및 변환
        if (response.data) {
          // 필요한 경우 응답 데이터 구조 변환
          const processedData: DiagramResponse = {
            ...response.data,
            // 필요한 경우 필드 변환 또는 기본값 설정
            components: response.data.components || [],
            connections: response.data.connections || [],
            dto: response.data.dto || [],
            metadata: response.data.metadata || {
              // 타입 호환성을 위해 MetadataDto 형식에 맞게 수정
              version: Number(versionId), // string을 number로 변환
              metadataId: 'metadata-default',
              lastModified: new Date().toISOString(),
              name: 'API',
              description: 'API 설명',
            },
          };

          // 응답 데이터 저장
          setDiagramData(processedData);
          console.log('다이어그램 데이터:', processedData);
        } else {
          console.error('응답 데이터가 없습니다.');
          setError('응답 데이터가 없습니다.');
        }
      } catch (err) {
        console.error('다이어그램 데이터 가져오기 오류:', err);

        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || err.message);
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    },
    [projectId, apiId, token]
  );

  // 선택된 버전이 변경되면 다이어그램 데이터 가져오기
  useEffect(() => {
    if (selectedVersion && projectId && apiId) {
      fetchDiagramData(selectedVersion);
    }
  }, [selectedVersion, fetchDiagramData, projectId, apiId]);

  // API 목록 가져오기 함수
  const fetchApiList = useCallback(async () => {
    if (!projectId) return;

    try {
      setApiListLoading(true);
      setApiListError(null);

      // API 호출
      const response = await axios.get(`/api/canvas-api/${projectId}`);

      // 응답 데이터 구조 확인 및 로깅
      console.log('API 응답 데이터:', response.data);

      // 응답 데이터에서 API 목록 추출 (data.content 또는 data 자체가 배열일 수 있음)
      let apiList: ApiListItem[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          // 응답이 직접 배열인 경우
          apiList = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // 응답이 { content: [...] } 형태인 경우
          apiList = response.data.content;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // 응답이 { items: [...] } 형태인 경우
          apiList = response.data.items;
        } else {
          // 다른 응답 형태에 대한 처리
          console.warn('예상치 못한 API 응답 형식:', response.data);
        }
      }

      setApiListData(apiList);
      console.log('API 목록:', apiList);
    } catch (err) {
      console.error('API 목록 가져오기 오류:', err);

      if (axios.isAxiosError(err)) {
        setApiListError(err.response?.data?.error || err.message);
      } else {
        setApiListError('API 목록을 가져오는 중 오류가 발생했습니다.');
      }
    } finally {
      setApiListLoading(false);
    }
  }, [projectId]);

  // 페이지 로드 시 API 목록 데이터 가져오기
  useEffect(() => {
    if (projectId) {
      fetchApiList();
    }
  }, [projectId, fetchApiList]);

  // completeApi 함수를 수정
  const completeApi = useCallback(() => {
    // 확인 모달 표시
    setShowConfirmModal(true);
  }, []);

  // API 완료 처리 실행 함수 추가
  const executeApiCompletion = useCallback(async () => {
    if (!projectId || !apiId) {
      alert('프로젝트 ID와 API ID가 필요합니다.');
      return;
    }

    try {
      // 확인 모달 닫기
      setShowConfirmModal(false);

      // API 호출
      const response = await fetch(`/api/canvas-api/${projectId}/${apiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` || '',
        },
        body: JSON.stringify({
          status: 'USER_COMPLETED',
        }),
      });

      // 완료 메시지 표시
      setShowCompletedMessage(true);

      // 2초 후 페이지 이동
      setTimeout(() => {
        if (projectId) {
          window.location.href = `/project/${projectId}/api`;
        }
      }, 2000);

      console.log('API 완료 응답:', response);
    } catch (err) {
      console.error('API 완료 처리 오류:', err);

      if (axios.isAxiosError(err)) {
        alert(`API 완료 처리 오류: ${err.response?.data?.error || err.message}`);
      } else {
        alert('API 완료 처리 중 오류가 발생했습니다.');
      }
    }
  }, [projectId, apiId, token]);

  // 모달 닫기 핸들러 수정
  const handleCloseModal = useCallback(() => {
    setShowConfirmModal(false);
    setShowCompletedMessage(false);
  }, []);

  // 버전 선택 핸들러 - 채팅 컴포넌트에서 호출됨
  const handleVersionSelect = useCallback(
    (versionId: string) => {
      console.log(`버전 선택: ${versionId}`);

      // 이미 선택된 버전이면 무시
      if (selectedVersion === versionId) return;

      // 상태 업데이트
      setSelectedVersion(versionId);

      // URL 쿼리 파라미터 업데이트 (새로고침 없이 URL 업데이트)
      if (projectId && apiId) {
        const url = new URL(window.location.href);
        url.searchParams.set('version', versionId);
        window.history.pushState({}, '', url.toString());
      }
    },
    [selectedVersion, projectId, apiId]
  );

  // 새 버전 정보 수신 핸들러 - 채팅 컴포넌트에서 호출됨
  const handleNewVersionInfo = useCallback(
    (versionInfo: { newVersionId: string; description: string }) => {
      console.log('새 버전 정보 수신:', versionInfo);

      if (versionInfo && versionInfo.newVersionId) {
        // 새 버전이 현재 선택된 버전과 다르고, 최신 버전보다 높은 경우에만 처리
        const newVersionNum = Number.parseInt(versionInfo.newVersionId, 10);
        const currentVersionNum = latestVersionRef.current ? Number.parseInt(latestVersionRef.current, 10) : 0;

        if (newVersionNum > currentVersionNum) {
          console.log(`새 버전 ${versionInfo.newVersionId}로 자동 전환합니다.`);

          // 최신 버전 참조 업데이트
          latestVersionRef.current = versionInfo.newVersionId;

          // 새 버전으로 URL 업데이트 및 페이지 이동
          if (projectId && apiId) {
            // 즉시 새 버전의 다이어그램 데이터 요청
            fetchDiagramData(versionInfo.newVersionId);

            // 선택된 버전 상태 업데이트
            setSelectedVersion(versionInfo.newVersionId);

            // URL 업데이트 (새로고침 없이)
            const url = new URL(window.location.href);
            url.searchParams.set('version', versionInfo.newVersionId);
            window.history.pushState({}, '', url.toString());

            console.log(`버전 ${versionInfo.newVersionId}의 다이어그램을 요청했습니다.`);
          }
        }
      }
    },
    [projectId, apiId, fetchDiagramData]
  );

  // 타겟 노드 변경 핸들러
  const handleTargetNodesChange = useCallback((nodes: TargetNode[]) => {
    setTargetNodes(nodes);
  }, []);

  // 마우스가 패널에 들어갈 때 호출
  const handleMouseEnter = useCallback(() => {
    setApiListVisible(true);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: SidePanelTab) => {
    setActiveTab(tab);
  }, []);

  // API 항목 클릭 핸들러
  const handleApiItemClick = useCallback(
    (clickedApiId: string) => {
      // 현재 보고 있는 API와 다른 경우에만 이동
      if (clickedApiId !== apiId && projectId) {
        // 클라이언트 사이드 라우팅 대신 전체 페이지 새로고침 사용
        window.location.href = `/canvas/${projectId}/${clickedApiId}?version=1`;
      }
    },
    [apiId, projectId]
  );

  // 뒤로 가기 핸들러
  const handleBackClick = useCallback(() => {
    if (projectId) {
      // 클라이언트 사이드 라우팅 대신 전체 페이지 새로고침 사용
      window.location.href = `/project/${projectId}/api`;
    }
  }, [projectId]);

  // Add this with the other useEffect hooks
  useEffect(() => {
    if (apiListData.length > 0 && apiId) {
      const currentApi = apiListData.find((item) => item.apiId === apiId);
      if (currentApi && currentApi.endpoint) {
        setCurrentApiEndpoint(currentApi.endpoint);
      }
    }
  }, [apiListData, apiId]);

  return (
    <div className='bg-blue-50 relative p-2'>
      {/* 슬라이드 패널을 위한 트리거 영역 */}
      <div
        className='hover:bg-gray-200 hover:bg-opacity-50 absolute top-0 bottom-0 left-0 z-10 w-6 transition-colors cursor-pointer'
        onMouseEnter={handleMouseEnter}
      />

      {/* API 목록 슬라이드 패널 - 너비 확장 */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out z-20 w-96 ${
          apiListVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={() => setApiListVisible(false)}
      >
        <div className='flex flex-col h-full p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <button
                onClick={handleBackClick}
                className='hover:bg-gray-200 flex items-center gap-1 px-3 py-1 text-gray-700 transition-colors bg-gray-100 rounded-md'
              >
                <ArrowLeft size={16} />
                <span>BACK</span>
              </button>
            </div>
            <button
              onClick={() => setApiListVisible(false)}
              className='hover:bg-gray-100 p-2 rounded-full'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* 탭 버튼 */}
          <div className='flex mb-4 border-b'>
            <button
              onClick={() => handleTabChange('api')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'api' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              API 목록
            </button>
            <button
              onClick={() => handleTabChange('dto')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'dto' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              DTO 정보
            </button>
          </div>

          {/* API 목록 탭 */}
          {activeTab === 'api' && (
            <>
              {apiListLoading ? (
                <div className='flex items-center justify-center flex-1'>
                  <div className='animate-spin w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full'></div>
                </div>
              ) : apiListError ? (
                <div className='flex-1 p-4 text-red-500'>{apiListError}</div>
              ) : (
                <div className='flex-1 overflow-y-auto'>
                  {apiListData.length === 0 ? (
                    <p className='text-center text-gray-500'>API 목록이 없습니다.</p>
                  ) : (
                    <ul className='space-y-3'>
                      {apiListData.map((item, index) => {
                        // 각 항목에 고유한 키 생성
                        const uniqueKey = `api-item-${index}-${item.apiId}`;
                        const isCurrentApi = item.apiId === apiId;

                        return (
                          <li
                            key={uniqueKey}
                            className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                              isCurrentApi ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => handleApiItemClick(item.apiId)}
                          >
                            <div className='text-lg font-medium'>{item.name || '이름 없음'}</div>

                            <div className='mb-1 text-sm'>
                              상태:
                              <span
                                className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                  item.status === 'AI_VISUALIZED'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'AI_GENERATED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {item.status || '알 수 없음'}
                              </span>
                            </div>

                            {/* Add endpoint display */}
                            {item.endpoint && (
                              <div className='p-1 mb-1 overflow-x-auto font-mono text-sm text-gray-700 bg-gray-100 rounded'>
                                {item.endpoint}
                              </div>
                            )}

                            {item.description && <p className='text-sm text-gray-700'>{item.description}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              <div className='pt-4'>
                <button
                  onClick={completeApi}
                  className='hover:bg-blue-600 w-full py-2 text-white transition-colors bg-blue-500 rounded'
                >
                  현재 API 완료 처리
                </button>
              </div>
            </>
          )}

          {/* DTO 정보 탭 */}
          {activeTab === 'dto' && (
            <div className='flex-1 overflow-hidden'>
              <DtoContainer
                diagramData={diagramData}
                loading={loading}
                onToggleCollapse={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      <div className='max-w-full mx-auto'>
        {/* 3단 레이아웃 - 비율 30:70 */}
        <div className='md:flex-row h-[calc(100vh-1rem)] flex flex-col gap-4 overflow-hidden'>
          {/* 왼쪽 섹션 (비율 30%) - 채팅 데이터 전달 */}
          <div className='md:w-[30%] w-full h-full min-w-0'>
            <div className='h-full'>
              <ChatContainer
                projectId={projectId}
                apiId={apiId}
                versionId={selectedVersion || ''}
                chatData={chatData}
                loading={chatLoading}
                error={chatError}
                onRefresh={fetchChatData}
                targetNodes={targetNodes}
                onVersionSelect={handleVersionSelect}
                onNewVersionInfo={handleNewVersionInfo}
              />
            </div>
          </div>

          {/* 오른쪽 섹션 (비율 70%) - 다이어그램 데이터 전달 */}
          <div
            className='md:w-[70%] w-full h-full min-w-0'
            id='diagram-container'
          >
            <div className='w-full h-full'>
              {loading ? (
                <div className='flex items-center justify-center h-full p-4 bg-white rounded-lg shadow'>
                  <div className='animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full'></div>
                </div>
              ) : error ? (
                <div className='flex items-center justify-center h-full p-4 bg-white rounded-lg shadow'>
                  <div className='bg-red-50 p-4 text-red-600 border-l-4 border-red-500 rounded-lg'>
                    <h3 className='mb-2 font-semibold'>오류 발생</h3>
                    <p>{error}</p>
                  </div>
                </div>
              ) : (
                <DiagramContainer
                  diagramData={diagramData}
                  loading={false}
                  error={null}
                  onSelectionChange={handleTargetNodesChange}
                  selectedVersion={selectedVersion}
                  versions={versions}
                  onVersionSelect={handleVersionSelect}
                  endpoint={currentApiEndpoint}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showConfirmModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md mx-4 overflow-hidden transition-all transform bg-white rounded-lg shadow-xl'>
            <div className='bg-blue-50 flex items-start p-4'>
              <div className='flex-shrink-0'>
                <Check className='w-6 h-6 text-blue-600' />
              </div>
              <div className='flex-1 ml-3'>
                <h3 className='text-lg font-medium text-blue-800'>API 완료 확인</h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <p>API를 완료 하시겠습니까?</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className='bg-blue-50 hover:text-blue-700 focus:outline-none inline-flex flex-shrink-0 ml-4 text-blue-500 rounded-md'
              >
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='bg-gray-50 px-4 py-3 text-right'>
              <button
                onClick={executeApiCompletion}
                className='hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md'
              >
                API 완료
              </button>
              <button
                onClick={handleCloseModal}
                className='hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md'
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompletedMessage && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md mx-4 overflow-hidden transition-all transform bg-white rounded-lg shadow-xl'>
            <div className='bg-blue-50 flex items-start p-4'>
              <div className='flex-shrink-0'>
                <Check className='w-6 h-6 text-blue-600' />
              </div>
              <div className='flex-1 ml-3'>
                <h3 className='text-lg font-medium text-blue-800'>완료 처리됨</h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <p>API를 완료했습니다.</p>
                  <p className='mt-1'>잠시 후 프로젝트 페이지로 이동합니다...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
