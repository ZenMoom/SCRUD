'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { fetchPosts } from '@/lib/feedback-api';
import {
  type GetPostListResponse,
  PostOrderEnumDto,
  PostSortEnumDto,
  type PostSummaryResponse,
  SearchTypeEnumDto,
} from '@generated/model';
import { LogIn, MessageCircle, MessageSquare, Search, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Pagination from '../Pagination';

// 카테고리 레이블 및 색상 매핑
const categoryConfig: Record<string, { label: string; color: string }> = {
  feature: { label: '기능 요청', color: 'bg-blue-100 text-blue-800' },
  bug: { label: '버그 리포트', color: 'bg-red-100 text-red-800' },
  improvement: { label: '개선 제안', color: 'bg-green-100 text-green-800' },
  question: { label: '질문', color: 'bg-purple-100 text-purple-800' },
};

// 피드백 게시판 컴포넌트
export default function FeedbackBoard({ postsData }: { postsData: GetPostListResponse }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // 현재 URL 쿼리 파라미터 값 가져오기
  const currentPage = searchParams.get('page') ? Number.parseInt(searchParams.get('page')!) : 1;
  const currentSize = searchParams.get('size') ? Number.parseInt(searchParams.get('size')!) : 10;
  const currentSort = (searchParams.get('sort') as PostSortEnumDto) || PostSortEnumDto.CREATED_AT;
  const currentOrder = (searchParams.get('order') as PostOrderEnumDto) || PostOrderEnumDto.DESC;
  const currentCategory = searchParams.get('category') || '';
  const currentKeyword = searchParams.get('keyword') || '';
  const currentSearchType = (searchParams.get('type') as SearchTypeEnumDto) || SearchTypeEnumDto.TITLE;

  const [feedbacks, setFeedbacks] = useState<PostSummaryResponse[]>(postsData.content || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(postsData.pageable?.totalPages || 1);
  const [totalElements, setTotalElements] = useState<number>(postsData.pageable?.totalElements || 0);

  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState<string>(currentKeyword);
  const [searchType, setSearchType] = useState<SearchTypeEnumDto>(currentSearchType);

  // URL 쿼리 파라미터 업데이트 함수
  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      return newParams.toString();
    },
    [searchParams]
  );

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // 페이지는 API에서 0부터 시작하므로 -1
      const data = await fetchPosts(
        currentPage - 1,
        currentSize,
        currentSort,
        currentOrder,
        currentCategory === 'all' ? undefined : currentCategory,
        currentKeyword || undefined,
        currentKeyword ? currentSearchType : undefined
      );
      setFeedbacks(data.content || []);
      setTotalPages(data.pageable?.totalPages || 1);
      setTotalElements(data.pageable?.totalElements || 0);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentSize, currentSort, currentOrder, currentCategory, currentKeyword, currentSearchType]);

  // 초기 데이터 설정
  useEffect(() => {
    setFeedbacks(postsData.content || []);
    setTotalPages(postsData.pageable?.totalPages || 1);
    setTotalElements(postsData.pageable?.totalElements || 0);
  }, [postsData]);

  // URL 파라미터 변경 시 데이터 새로고침
  useEffect(() => {
    // 서버에서 가져온 초기 데이터가 있으면 클라이언트 사이드 페칭은 건너뜀
    if (postsData.content?.length && currentPage === 1 && currentCategory === 'all' && !currentKeyword) {
      return;
    }
    refreshData();
  }, [
    currentPage,
    currentSize,
    currentSort,
    currentOrder,
    currentCategory,
    currentKeyword,
    currentSearchType,
    postsData.content?.length,
    refreshData,
  ]);

  // 필터링 함수
  const filterFeedbacks = (category: string) => {
    router.push(`/feedback?${createQueryString({ category, page: '1' })}`);
  };

  // 정렬 변경 함수
  const changeSort = (sort: PostSortEnumDto) => {
    router.push(`/feedback?${createQueryString({ sort })}`);
  };

  // 정렬 방향 변경 함수
  const changeOrder = (order: PostOrderEnumDto) => {
    router.push(`/feedback?${createQueryString({ order })}`);
  };

  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    router.push(`/feedback?${createQueryString({ page: page.toString() })}`);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 검색 함수
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/feedback?${createQueryString({ keyword: searchKeyword, type: searchType, page: '1' })}`);
    } else if (currentKeyword) {
      // 검색어가 비어있고 현재 검색 중이면 검색 초기화
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('keyword');
      newParams.delete('type');
      newParams.set('page', '1');
      router.push(`/feedback?${newParams.toString()}`);
    }
  };

  // 검색 초기화 함수
  const resetSearch = () => {
    setSearchKeyword('');
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('keyword');
    newParams.delete('type');
    newParams.set('page', '1');
    router.push(`/feedback?${newParams.toString()}`);
  };

  // 새 피드백 작성 함수
  const handleNewFeedback = () => {
    router.push(`/feedback/new`);
  };

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='max-w-7xl md:py-20 px-6 py-8 mx-auto'>
        <div className='mb-10'>
          <h1 className='md:text-5xl text-5xl font-bold text-gray-800'>
            <span className='bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 text-transparent'>피드백</span>{' '}
            게시판
          </h1>
          <p className='mt-2 text-gray-600'>사용자들의 의견과 제안을 공유하는 공간입니다</p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full'></div>
          </div>
        )}

        {/* 피드백 게시판 */}
        {!loading && (
          <div className='rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm'>
            {/* 상단 필터 및 버튼 */}
            <div className='sm:flex-row sm:items-center flex flex-col items-start justify-between gap-4 p-4 border-b border-gray-100'>
              {/* 필터 버튼 그룹 */}
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => filterFeedbacks('')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentCategory === 'all'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => filterFeedbacks('feature')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentCategory === 'feature'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  기능 요청
                </button>
                <button
                  onClick={() => filterFeedbacks('bug')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentCategory === 'bug'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  버그 리포트
                </button>
                <button
                  onClick={() => filterFeedbacks('improvement')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    currentCategory === 'improvement'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  개선 제안
                </button>
              </div>

              {/* 검색 폼 */}
              <form
                onSubmit={handleSearch}
                className='flex items-center gap-2'
              >
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as SearchTypeEnumDto)}
                  className='px-3 py-1 text-sm border border-gray-200 rounded-md'
                >
                  <option value={SearchTypeEnumDto.TITLE}>제목</option>
                  <option value={SearchTypeEnumDto.CONTENT}>내용</option>
                  <option value={SearchTypeEnumDto.TITLE_CONTENT}>제목+내용</option>
                </select>
                <div className='relative'>
                  <input
                    type='text'
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder='검색어 입력...'
                    className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 py-1 pl-3 pr-10 text-sm border border-gray-200 rounded-md'
                  />
                  <button
                    type='submit'
                    className='right-2 top-1/2 hover:text-gray-600 absolute text-gray-400 transform -translate-y-1/2'
                  >
                    <Search className='w-4 h-4' />
                  </button>
                </div>
              </form>

              {/* 정렬 옵션 */}
              <div className='flex items-center gap-2'>
                <select
                  value={currentSort}
                  onChange={(e) => changeSort(e.target.value as PostSortEnumDto)}
                  className='px-3 py-1 text-sm border border-gray-200 rounded-md'
                >
                  <option value={PostSortEnumDto.CREATED_AT}>최신순</option>
                  <option value={PostSortEnumDto.VIEW_COUNT}>조회순</option>
                  <option value={PostSortEnumDto.LIKE_COUNT}>인기순</option>
                </select>
                <select
                  value={currentOrder}
                  onChange={(e) => changeOrder(e.target.value as PostOrderEnumDto)}
                  className='px-3 py-1 text-sm border border-gray-200 rounded-md'
                >
                  <option value={PostOrderEnumDto.DESC}>내림차순</option>
                  <option value={PostOrderEnumDto.ASC}>오름차순</option>
                </select>
                <button
                  onClick={handleNewFeedback}
                  className='hover:bg-blue-600 flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-500 rounded-lg'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='w-5 h-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  새 피드백 작성
                </button>
              </div>
            </div>

            {/* 로그인 안내 배너 (비로그인 사용자에게만 표시) */}
            {!isAuthenticated && (
              <div className='bg-blue-50 p-4 border-b border-blue-100'>
                <div className='flex items-center gap-3'>
                  <LogIn className='w-5 h-5 text-blue-500' />
                  <p className='text-blue-700'>
                    <Link
                      href={`/login?redirect=/feedback?${searchParams.toString()}`}
                      className='font-medium underline'
                    >
                      로그인
                    </Link>
                    하시면 피드백에 투표하는 기능을 사용할 수 있습니다. 피드백 작성은 로그인 없이도 가능합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 검색 결과 표시 */}
            {currentKeyword && (
              <div className='bg-gray-50 p-4 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <p className='text-gray-700'>
                    <span className='font-medium'>&quot;{currentKeyword}&quot;</span>에 대한 검색 결과 ({totalElements}
                    건)
                  </p>
                  <button
                    onClick={resetSearch}
                    className='hover:text-gray-700 text-sm text-gray-500'
                  >
                    검색 초기화
                  </button>
                </div>
              </div>
            )}

            {/* 피드백이 없는 경우 */}
            {feedbacks.length === 0 ? (
              <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
                <div className='bg-gray-50 p-4 mb-4 rounded-full'>
                  <MessageCircle className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='mb-2 text-lg font-medium text-gray-800'>
                  {currentKeyword ? '검색 결과가 없습니다' : '등록된 피드백이 없습니다'}
                </h3>
                <p className='max-w-md mb-6 text-gray-500'>
                  {currentKeyword
                    ? '다른 검색어로 다시 시도해보세요.'
                    : '첫 번째 피드백을 작성하여 의견을 공유해보세요.'}
                </p>
                {currentKeyword ? (
                  <button
                    onClick={resetSearch}
                    className='hover:bg-gray-200 flex items-center gap-2 px-4 py-2 mr-2 text-gray-700 transition-colors bg-gray-100 rounded-lg'
                  >
                    검색 초기화
                  </button>
                ) : (
                  <button
                    onClick={handleNewFeedback}
                    className='hover:bg-blue-600 flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-500 rounded-lg'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='w-5 h-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                    새 피드백 작성하기
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className='divide-y divide-gray-100'>
                  {/* 피드백 목록 */}
                  {feedbacks.map((feedback) => (
                    <div
                      key={feedback.postId}
                      className='group hover:bg-gray-50 transition-colors'
                    >
                      <div className='p-6'>
                        <div className='flex items-start justify-between mb-4'>
                          <div>
                            {/* 피드백 제목 및 카테고리 */}
                            <div className='flex items-center gap-3 mb-1'>
                              <h3 className='hover:text-blue-600 text-lg font-medium text-gray-900'>
                                <Link href={`/feedback/${feedback.postId}`}>{feedback.title}</Link>
                              </h3>
                              {feedback.category && categoryConfig[feedback.category] && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    categoryConfig[feedback.category].color
                                  }`}
                                >
                                  {categoryConfig[feedback.category].label}
                                </span>
                              )}
                            </div>

                            {/* 작성 날짜 */}
                            <div className='flex items-center gap-2 text-sm text-gray-500'>
                              <span>{feedback.createdAt}</span>
                              <span>•</span>
                              <span>조회 {feedback.viewCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* 투표 및 댓글 수 */}
                        <div className='flex items-center gap-4'>
                          {/* 좋아요 버튼 */}
                          <div className={`flex items-center gap-1 text-sm text-gray-500`}>
                            <ThumbsUp className='w-4 h-4' />
                            <span>{feedback.likeCount}</span>
                          </div>

                          {/* 댓글 수 */}
                          <div className='flex items-center gap-1 text-sm text-gray-500'>
                            <MessageSquare className='w-4 h-4' />
                            <span>{feedback.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className='p-4 border-t border-gray-100'>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
