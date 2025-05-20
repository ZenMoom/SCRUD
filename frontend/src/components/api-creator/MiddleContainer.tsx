'use client';

import useAuthStore from '@/app/store/useAuthStore';
import EmojiPicker from '@/components/project-card/emoji-picker';
import { ApiProcessStateEnumDto } from '@generated/model';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  status: ApiProcessStateEnumDto;
  apiSpecVersionId?: number;
}

interface ApiGroup {
  id: string;
  name: string;
  emoji?: string;
  endpoints: ApiEndpoint[];
}

interface MiddleContainerProps {
  onApiSelect: (apiPath: string, apiMethod: string) => void;
  apiGroups: ApiGroup[];
  setApiGroups: React.Dispatch<React.SetStateAction<ApiGroup[]>>;
  isLoading: boolean;
  scrudProjectId: number;
}

export default function MiddleContainer({ onApiSelect, apiGroups, setApiGroups, isLoading }: MiddleContainerProps) {
  const { token } = useAuthStore();

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newEndpointPath, setNewEndpointPath] = useState('');
  const [editingEmoji, setEditingEmoji] = useState<string | null>(null);

  // 선택된 API 그룹 및 엔드포인트 추적을 위한 상태 추가
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);

  // 엔드포인트 편집 시 인풋 참조
  const editInputRef = useRef<HTMLInputElement>(null);

  // 랜덤 이모지 선택 함수 - 간단한 배열에서 선택
  const getRandomEmoji = () => {
    const allEmojis = [
      '📊',
      '📈',
      '🚀',
      '💡',
      '✨',
      '🔍',
      '📱',
      '💻',
      '🎨',
      '🛠️',
      '⚙️',
      '🔧',
      '🔨',
      '📌',
      '📋',
      '📂',
      '📁',
      '🗃️',
      '🗄️',
      '📮',
    ];
    return allEmojis[Math.floor(Math.random() * allEmojis.length)];
  };

  // API 그룹 추가 함수 - 랜덤 이모지 추가
  const addApiGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    setApiGroups([
      ...apiGroups,
      {
        id: newGroupId,
        name: '/api/v1/new',
        emoji: getRandomEmoji(), // 랜덤 이모지 할당
        endpoints: [],
      },
    ]);
    setEditingGroupId(newGroupId);
    setNewGroupName('/api/v1/new');
  };

  // API 엔드포인트 추가 함수
  const addApiEndpoint = (groupId: string) => {
    const group = apiGroups.find((g) => g.id === groupId);
    if (!group) return;

    const timestamp = Date.now();
    const newEndpointId = `${groupId}-endpoint-${timestamp}`;
    const basePath = group.name;
    const newEndpoint = {
      id: newEndpointId,
      path: `${basePath}/new`,
      method: 'GET',
      status: 'AI_GENERATED' as ApiProcessStateEnumDto,
    };

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: [...group.endpoints, newEndpoint],
          };
        }
        return group;
      })
    );

    setEditingEndpointId(newEndpointId);
    setNewEndpointPath(`${basePath}/new`);
  };

  // API 엔드포인트 삭제 함수
  const deleteApiEndpoint = async (groupId: string, endpointId: string) => {
    if (confirm('이 API 엔드포인트를 삭제하시겠습니까?')) {
      try {
        // 해당 엔드포인트 정보 찾기
        const group = apiGroups.find((g) => g.id === groupId);
        const endpoint = group?.endpoints.find((e) => e.id === endpointId);

        if (!endpoint || !endpoint.apiSpecVersionId) {
          return;
        }

        // 헤더에 Bearer 토큰 추가
        const headers = {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        };

        // 백엔드 API 호출하여 실제 데이터 삭제
        await axios.delete(`/api/api-specs/${endpoint.apiSpecVersionId}`, { headers });
        alert(`성공적으로 삭제되었습니다.`);

        // 성공적으로 삭제된 후 UI 상태 업데이트
        const updatedGroups = apiGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              endpoints: group.endpoints.filter((e) => e.id !== endpointId),
            };
          }
          return group;
        });

        setApiGroups(updatedGroups);
        setEditingEndpointId(null); // 편집 상태 초기화

        // 삭제한 엔드포인트가 현재 선택된 엔드포인트인 경우 선택 해제
        if (selectedEndpointId === endpointId) {
          setSelectedEndpointId(null);
        }
      } catch {
        alert('API 스펙 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  // API 그룹 삭제 함수
  const deleteApiGroup = async (groupId: string) => {
    if (confirm('이 API 그룹과 그룹에 속한 모든 엔드포인트를 삭제하시겠습니까?')) {
      try {
        const group = apiGroups.find((g) => g.id === groupId);
        if (!group) return;

        // 그룹 내 모든 엔드포인트 중 apiSpecVersionId가 있는 엔드포인트 필터링
        const endpointsWithApiSpecId = group.endpoints.filter((endpoint) => endpoint.apiSpecVersionId);

        if (endpointsWithApiSpecId.length > 0) {
          // 백엔드에 저장된 엔드포인트가 있는 경우
          const deletionPromises = endpointsWithApiSpecId.map(async (endpoint) => {
            try {
              // 헤더에 Bearer 토큰 추가
              const headers = {
                Authorization: token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
              };

              // 백엔드 API 호출하여 실제 데이터 삭제
              await axios.delete(`/api/api-specs/${endpoint.apiSpecVersionId}`, { headers });
              return true;
            } catch {
              alert(`API 엔드포인트 ${endpoint.path} 삭제 중 오류가 발생했습니다.`);
              return false;
            }
          });

          // 모든 삭제 작업이 완료될 때까지 기다림
          const results = await Promise.all(deletionPromises);

          // 삭제 결과 확인
          const successCount = results.filter((result) => result).length;
          const failCount = results.filter((result) => !result).length;

          if (failCount > 0) {
            alert(
              `${successCount}개의 엔드포인트가 삭제되었으나, ${failCount}개의 엔드포인트 삭제 중 오류가 발생했습니다.`
            );
          } else {
            alert(`${successCount}개의 엔드포인트와 함께 그룹이 성공적으로 삭제되었습니다.`);
          }
        } else {
          // 백엔드에 저장된 엔드포인트가 없는 경우
          alert('그룹이 삭제되었습니다.');
        }

        // UI 업데이트 - 해당 그룹 제거
        setApiGroups(apiGroups.filter((g) => g.id !== groupId));

        // 해당 그룹의 엔드포인트 중 선택된 것이 있으면 선택 해제
        const hasSelectedEndpoint = group.endpoints.some((endpoint) => endpoint.id === selectedEndpointId);
        if (hasSelectedEndpoint) {
          setSelectedEndpointId(null);
        }
      } catch {
        alert('API 그룹 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  // API 엔드포인트 선택 함수
  const handleApiSelect = (groupId: string, endpoint: ApiEndpoint) => {
    setSelectedEndpointId(endpoint.id);
    onApiSelect(endpoint.path, endpoint.method);
  };

  // API 그룹 이름 편집 시작
  const startEditingGroup = (groupId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // 그룹 선택 이벤트 중단
    }

    const group = apiGroups.find((g) => g.id === groupId);
    if (group) {
      setEditingGroupId(groupId);
      setNewGroupName(group.name);
    }
  };

  // API 그룹 이모지 편집 시작
  const startEditingEmoji = (groupId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // 이벤트 전파 방지
    }
    setEditingEmoji(groupId);
  };

  // API 그룹 이모지 업데이트
  const updateGroupEmoji = (groupId: string, emoji: string) => {
    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            emoji: emoji,
          };
        }
        return group;
      })
    );
    setEditingEmoji(null);
  };

  // API 엔드포인트 편집
  const startEditingEndpoint = (groupId: string, endpointId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // 이벤트 전파 방지
    }

    const group = apiGroups.find((g) => g.id === groupId);
    const endpoint = group?.endpoints.find((e) => e.id === endpointId);

    if (endpoint) {
      setEditingEndpointId(endpointId);
      setNewEndpointPath(endpoint.path);

      // 다음 렌더링 후 인풋에 포커스
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 0);
    }
  };

  // API 그룹 이름 저장
  const saveGroupName = () => {
    if (!editingGroupId || !newGroupName.trim()) return;

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === editingGroupId) {
          // 그룹 이름 변경 시 하위 엔드포인트 경로도 함께 수정
          const oldName = group.name;
          const updatedEndpoints = group.endpoints.map((endpoint) => ({
            ...endpoint,
            path: endpoint.path.replace(oldName, newGroupName),
          }));

          return {
            ...group,
            name: newGroupName,
            endpoints: updatedEndpoints,
          };
        }
        return group;
      })
    );

    setEditingGroupId(null);
  };

  // API 엔드포인트 저장
  const saveEndpoint = (groupId: string) => {
    if (!editingEndpointId || !newEndpointPath.trim()) return;

    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.map((endpoint) => {
              if (endpoint.id === editingEndpointId) {
                return {
                  ...endpoint,
                  path: newEndpointPath,
                };
              }
              return endpoint;
            }),
          };
        }
        return group;
      })
    );

    setEditingEndpointId(null);
  };

  // API 상태 변경 함수
  const updateEndpointStatus = async (
    groupId: string,
    endpointId: string,
    status: ApiProcessStateEnumDto,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation(); // 상태 변경 시 클릭 이벤트 전파 방지
    }

    // API ID 가져오기
    const group = apiGroups.find((g) => g.id === groupId);
    const endpoint = group?.endpoints.find((e) => e.id === endpointId);

    if (!endpoint || !endpoint.apiSpecVersionId) {
      return;
    }

    // 상태 변경 제한 검증
    if (endpoint.status === 'AI_GENERATED') {
      return;
    }

    // "작업중" 또는 "완료" 상태에서 "생성됨" 상태로 돌아갈 수 없음
    if ((endpoint.status === 'AI_VISUALIZED' || endpoint.status === 'USER_COMPLETED') && status === 'AI_GENERATED') {
      return;
    }

    // 특정 로직을 추가할 자리 (여기에 필요한 로직 추가)

    // 먼저 UI 상태 업데이트 (낙관적 업데이트)
    setApiGroups(
      apiGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            endpoints: group.endpoints.map((endpoint) => {
              if (endpoint.id === endpointId) {
                return {
                  ...endpoint,
                  status,
                };
              }
              return endpoint;
            }),
          };
        }
        return group;
      })
    );

    // API 스펙 상태 업데이트 요청
    try {
      await axios.patch(
        `/api/api-specs/api/${endpoint.apiSpecVersionId}`,
        { apiSpecStatus: status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch {
      alert('API 상태 업데이트 중 오류 발생:');

      // 요청 실패 시 UI 롤백
      setApiGroups(
        apiGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              endpoints: group.endpoints.map((ep) => {
                if (ep.id === endpointId) {
                  return {
                    ...ep,
                    status: endpoint.status, // 원래 상태로 복원
                  };
                }
                return ep;
              }),
            };
          }
          return group;
        })
      );
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditingEndpointId(null);
    setEditingEmoji(null);
  };

  // 엔터 키 입력 시 저장
  const handleKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter') {
      saveEndpoint(groupId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 외부 클릭 시 편집 취소
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingEndpointId) {
        // 클릭된 요소가 삭제 버튼인지 확인
        const isDeleteButton = (e.target as Element)?.closest('[data-delete-button="true"]');

        // 인풋이나 삭제 버튼이 아닌 곳을 클릭했을 때만 편집 모드 종료
        if (!editInputRef.current?.contains(e.target as Node) && !isDeleteButton) {
          cancelEditing();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingEndpointId]);

  // 상태에 따른 색상 및 텍스트 표시 함수
  const getStatusStyle = (status: ApiProcessStateEnumDto) => {
    switch (status) {
      case 'AI_GENERATED':
        return 'bg-gray-200 text-gray-700';
      case 'AI_VISUALIZED':
        return 'bg-blue-100 text-blue-700';
      case 'USER_COMPLETED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className='flex flex-col w-full h-full bg-white'>
      {/* 고정 헤더 영역 */}
      <div className='flex-shrink-0'>
        <div className='px-4 py-3'>
          <h2 className='text-lg font-bold text-gray-800'>API 관리</h2>
        </div>
        <div className='flex justify-center px-2 pb-2 mt-1'>
          <button
            className='py-1.5 hover:bg-gray-50 hover:shadow flex items-center gap-2 px-3 text-sm font-medium text-gray-800 transition-all duration-300 bg-white border border-gray-300 rounded-lg shadow-sm'
            onClick={addApiGroup}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-4 h-4'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
                clipRule='evenodd'
              />
            </svg>
            <span>API 그룹 추가</span>
          </button>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className='[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 overflow-x-hidden overflow-y-auto'>
        {isLoading ? (
          <div className='flex items-center justify-center py-10'>
            <div className='animate-spin w-8 h-8 border-b-2 border-blue-500 rounded-full'></div>
            <span className='ml-2 text-gray-600'>API 목록을 불러오는 중...</span>
          </div>
        ) : (
          <div className='px-2 py-1 divide-y divide-gray-200'>
            {apiGroups.map((group) => (
              <div
                key={group.id}
                className='relative px-2 py-2 overflow-hidden'
              >
                <div className='flex items-center justify-between'>
                  {editingGroupId === group.id ? (
                    <div className='flex items-center w-full gap-2'>
                      {/* 이모지 버튼 */}
                      <div className='relative z-10 flex-shrink-0'>
                        {editingEmoji === group.id ? (
                          <EmojiPicker
                            selectedEmoji={group.emoji || '📂'}
                            onEmojiSelect={(emoji) => updateGroupEmoji(group.id, emoji)}
                          />
                        ) : (
                          <button
                            className='hover:bg-gray-50 p-2 text-2xl transition-colors rounded-md'
                            onClick={(e) => startEditingEmoji(group.id, e)}
                          >
                            {group.emoji || '📂'}
                          </button>
                        )}
                      </div>

                      <input
                        type='text'
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className='min-w-[100px] focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md'
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveGroupName();
                          else if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <div className='flex gap-1'>
                        <button
                          className='hover:bg-blue-600 px-2 py-1 text-sm text-white transition-colors bg-blue-500 rounded-md'
                          onClick={saveGroupName}
                        >
                          저장
                        </button>
                        <button
                          className='hover:text-gray-800 px-2 py-1 text-sm text-gray-600 transition-colors rounded-md'
                          onClick={cancelEditing}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center w-full gap-2'>
                      {/* 이모지 버튼 */}
                      <div className='relative z-10 flex-shrink-0'>
                        {editingEmoji === group.id ? (
                          <EmojiPicker
                            selectedEmoji={group.emoji || '📂'}
                            onEmojiSelect={(emoji) => updateGroupEmoji(group.id, emoji)}
                          />
                        ) : (
                          <button
                            className='hover:bg-gray-50 p-2 text-2xl transition-colors rounded-md'
                            onClick={(e) => startEditingEmoji(group.id, e)}
                            title='이모지 변경'
                          >
                            {group.emoji || '📂'}
                          </button>
                        )}
                      </div>

                      <h3
                        className='hover:text-blue-500 max-w-[160px] flex-1 font-medium text-gray-800 truncate transition-colors cursor-pointer'
                        onClick={(e) => startEditingGroup(group.id, e)}
                        title={group.name}
                      >
                        {group.name}
                      </h3>
                      <div className='flex items-center'>
                        <button
                          className='hover:bg-gray-200 flex-shrink-0 p-1 transition-colors rounded-full'
                          onClick={(e) => {
                            e.stopPropagation();
                            addApiEndpoint(group.id);
                          }}
                          title='엔드포인트 추가'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='w-4 h-4 text-gray-700'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </button>
                        <button
                          className='text-black-400 hover:text-black-600 flex-shrink-0 p-1 ml-1 transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApiGroup(group.id);
                          }}
                          title='그룹 및 모든 엔드포인트 삭제'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='w-4 h-4'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                          >
                            <path
                              fillRule='evenodd'
                              d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <ul className='mt-1 space-y-1'>
                  {group.endpoints.map((endpoint) => (
                    <li
                      key={endpoint.id}
                      className={`ml-4 overflow-hidden ${
                        selectedEndpointId === endpoint.id ? 'bg-gray-100 rounded' : ''
                      }`}
                    >
                      {editingEndpointId === endpoint.id ? (
                        // 편집 모드 UI
                        <div className='flex flex-wrap items-center gap-1 text-sm'>
                          <input
                            ref={editInputRef}
                            type='text'
                            value={newEndpointPath}
                            onChange={(e) => setNewEndpointPath(e.target.value)}
                            className='min-w-[100px] focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md'
                            onKeyDown={(e) => handleKeyDown(e, group.id)}
                          />

                          <button
                            data-delete-button='true'
                            className='py-0.5 hover:bg-red-50 flex-shrink-0 px-1 ml-auto text-xs text-red-500 rounded'
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteApiEndpoint(group.id, endpoint.id);
                            }}
                            title='삭제'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='w-4 h-4'
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
                      ) : (
                        // 일반 모드 UI
                        <div
                          className={`flex justify-between items-center rounded-sm gap-1 ${
                            selectedEndpointId === endpoint.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                          } transition-colors py-1 overflow-hidden cursor-pointer`}
                          onClick={() => handleApiSelect(group.id, endpoint)}
                          onDoubleClick={(e) => startEditingEndpoint(group.id, endpoint.id, e)}
                        >
                          {/* 상태 드롭다운 */}
                          <div className='w-18 relative flex-shrink-0 inline-block text-left'>
                            <select
                              value={endpoint.status}
                              onChange={(e) =>
                                updateEndpointStatus(group.id, endpoint.id, e.target.value as ApiProcessStateEnumDto)
                              }
                              className={`appearance-none text-xs px-2 py-0.5 rounded w-full cursor-pointer focus:outline-none ${getStatusStyle(
                                endpoint.status
                              )} pr-6`}
                              onClick={(e) => e.stopPropagation()}
                              disabled={endpoint.status === 'AI_GENERATED'}
                            >
                              <option
                                value='AI_GENERATED'
                                className='text-gray-700 bg-white'
                                disabled={endpoint.status === 'AI_VISUALIZED' || endpoint.status === 'USER_COMPLETED'}
                              >
                                생성됨
                              </option>
                              <option
                                value='AI_VISUALIZED'
                                className='text-blue-700 bg-white'
                              >
                                작업중
                              </option>
                              <option
                                value='USER_COMPLETED'
                                className='text-green-700 bg-white'
                              >
                                완료
                              </option>
                            </select>
                            <div className='right-1 absolute inset-y-0 flex items-center pointer-events-none'>
                              <svg
                                className='w-3 h-3'
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </div>
                          </div>

                          {/* HTTP 메서드 태그 추가 */}
                          <div className='flex-shrink-0 w-16 text-center'>
                            <span
                              className={`px-2 py-0.5 text-xs rounded font-medium inline-block ${
                                endpoint.method === 'GET'
                                  ? 'text-green-800'
                                  : endpoint.method === 'POST'
                                  ? 'text-blue-800'
                                  : endpoint.method === 'PUT'
                                  ? 'text-yellow-800'
                                  : endpoint.method === 'PATCH'
                                  ? 'text-purple-800'
                                  : endpoint.method === 'DELETE'
                                  ? 'text-red-800'
                                  : 'text-gray-800'
                              }`}
                            >
                              {endpoint.method}
                            </span>
                          </div>

                          {/* 경로 표시 */}
                          <span
                            className='hover:text-blue-500 flex-1 text-sm text-gray-800 truncate transition-colors'
                            title={endpoint.path}
                          >
                            {endpoint.path.startsWith(group.name)
                              ? endpoint.path.substring(group.name.length) || '/'
                              : endpoint.path}
                          </span>

                          {/* 점 세개 버튼 */}
                          <div className='flex items-center flex-shrink-0 gap-1'>
                            <button
                              className='hover:text-gray-700 hover:bg-gray-100 flex-shrink-0 p-1 text-gray-500 transition-colors rounded-sm'
                              title='편집'
                              onClick={(e) => startEditingEndpoint(group.id, endpoint.id, e)}
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='w-4 h-4'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                              >
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {apiGroups.length === 0 && !isLoading && (
              <div className='py-4 text-center text-gray-500'>
                <p>API 그룹이 없습니다. 새 API 그룹을 추가하세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
