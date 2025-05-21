'use client';

import { formatToKST } from '@/util/dayjs';
import { Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useAuthStore from '../../app/store/useAuthStore';

interface ProjectInfo {
  id: number;
  title: string;
  description?: string;
  serverUrl?: string;
}

interface ApiHeaderProps {
  project: ProjectInfo;
}

export default function ApiHeader({ project }: ApiHeaderProps) {
  // 로고 이미지 경로
  const logoPath = '/faviconblack.png';
  // 상태 관리
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editedProject, setEditedProject] = useState<ProjectInfo>(project);

  // 인증 상태 및 기능 가져오기
  const { isAuthenticated, user, logout, token } = useAuthStore();
  const router = useRouter();

  // 프로젝트 정보 수정 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProject((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 저장 버튼 핸들러
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // 기본 동작 방지

    try {
      console.log('저장 시도 중...', editedProject);

      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` || '',
        },
        body: JSON.stringify({
          scrudProjectId: editedProject.id,
          title: editedProject.title,
          description: editedProject.description || '',
          serverUrl: editedProject.serverUrl || '',
        }),
      });

      console.log('API 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(formatToKST(new Date().toISOString()), 'API 에러 응답:', errorData);
        throw new Error(errorData.message || '프로젝트 정보 수정에 실패했습니다.');
      }

      const result = await response.json();
      console.log('API 응답 데이터:', result);

      // 성공적으로 업데이트된 경우에만 모달 닫기 및 페이지 새로고침
      setShowModal(false);
      window.location.reload();
    } catch (error) {
      console.error(formatToKST(new Date().toISOString()), '프로젝트 정보 수정 중 오류 발생:', error);
      alert('프로젝트 정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    setEditedProject(project); // 원래 데이터로 복구
    setShowModal(false);
  };

  // 로그인 버튼 클릭 핸들러
  const handleLoginClick = useCallback(() => {
    router.push('/login');
  }, [router]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout();
    setShowProfileMenu(false);
    router.push('/login');
  }, [logout, router]);

  // 클릭 이벤트 핸들러 (드롭다운 외부 클릭 시 닫기)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // 모달이 열릴 때마다 editedProject 초기화
  useEffect(() => {
    if (showModal) {
      setEditedProject(project);
    }
  }, [showModal, project]);

  return (
    <>
      <header className='h-[60px] bg-blue-50 sticky z-50 w-full'>
        <div className='flex items-center justify-between w-full h-full px-4'>
          {/* 로고 및 프로젝트명 영역 */}
          <div className='flex items-center gap-4'>
            <Link
              href='/'
              className='cursor-pointer'
            >
              <Image
                src={logoPath || '/placeholder.svg'}
                alt='로고'
                width={40}
                height={32}
                priority
              />
            </Link>

            <div className='flex items-center gap-2'>
              <h2 className='max-w-[200px] text-xl font-semibold text-gray-800 truncate'>{project.title}</h2>
              <button
                onClick={() => setShowModal(true)}
                className='hover:bg-gray-100 p-1 transition-colors rounded-full'
                title='프로젝트 정보 보기'
              >
                <Pencil className='w-4 h-4 text-gray-600' />
              </button>
            </div>
          </div>

          {/* 우측 영역 - 사용자 정보 */}
          <div className='flex items-center gap-3'>
            {isAuthenticated && user ? (
              <div className='flex items-center gap-3'>
                <div className='profile-menu-container relative'>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className='focus:outline-none flex items-center'
                  >
                    <div className='hover:border-gray-300 w-10 h-10 overflow-hidden transition-colors border-2 border-gray-200 rounded-full'>
                      {user.profileImgUrl ? (
                        <Image
                          src={user.profileImgUrl || '/placeholder.svg'}
                          alt='프로필'
                          width={40}
                          height={40}
                          className='object-cover w-full h-full'
                        />
                      ) : (
                        <div className='flex items-center justify-center w-full h-full text-gray-500 bg-gray-200'>
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
                              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {showProfileMenu && (
                    <div className='top-full absolute right-0 z-50 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg'>
                      <div className='px-4 py-3 border-b border-gray-100'>
                        <p className='text-sm font-medium text-gray-900 truncate'>{user.username || '사용자'}</p>
                      </div>
                      <ul>
                        <li>
                          <button
                            onClick={handleLogout}
                            className='hover:bg-gray-100 block w-full px-4 py-3 text-sm text-left text-gray-700'
                          >
                            로그아웃
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className='hover:bg-black hover:text-white px-6 py-2 font-bold tracking-wider text-black uppercase transition-colors duration-200 border-2 border-black'
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 프로젝트 정보 모달 */}
      {showModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center'
          onClick={() => setShowModal(false)}
        >
          {/* 검은색 반투명 오버레이 */}
          <div className='opacity-40 absolute inset-0 z-0 bg-black' />
          <div
            className='w-[500px] z-10 p-12 bg-white rounded-lg shadow-lg'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>프로젝트 정보</h2>
              <button
                onClick={() => setShowModal(false)}
                className='hover:text-gray-700 text-gray-500'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block mb-1 text-sm font-medium text-gray-700'>프로젝트 명</label>
                <input
                  type='text'
                  name='title'
                  value={editedProject.title}
                  onChange={handleInputChange}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 border border-gray-300 rounded'
                />
              </div>
              <div>
                <label className='block mb-1 text-sm font-medium text-gray-700'>프로젝트 설명</label>
                <textarea
                  name='description'
                  value={editedProject.description || ''}
                  onChange={handleInputChange}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] w-full p-2 border border-gray-300 rounded'
                />
              </div>
              <div>
                <label className='block mb-1 text-sm font-medium text-gray-700'>서버 URL</label>
                <input
                  type='text'
                  name='serverUrl'
                  value={editedProject.serverUrl || ''}
                  onChange={handleInputChange}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 w-full p-2 border border-gray-300 rounded'
                />
              </div>
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={handleCancel}
                className='hover:text-gray-800 px-4 py-2 text-gray-600 transition-colors'
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className='hover:bg-blue-600 px-4 py-2 text-white transition-colors bg-blue-500 rounded'
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
