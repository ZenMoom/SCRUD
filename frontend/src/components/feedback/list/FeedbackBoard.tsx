'use client';

import type React from 'react';

import useAuthStore from '@/app/store/useAuthStore';
import { fetchPosts } from '@/lib/feedback-api';
import { numberToCategoryMap } from '@/types/feedback';
import { formatToKST } from '@/util/dayjs';
import {
  type GetPostListResponse,
  PostOrderEnumDto,
  PostSortEnumDto,
  PostStatusEnumDto,
  type PostSummaryResponse,
  SearchTypeEnumDto,
} from '@generated/model';
import { CheckCircle2, Clock, LogIn, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FeedbackFilter from './FeedbackFilter';
import FeedbackListHeader from './FeedbackListHeader';
import FeedbackListItem from './FeedbackListItem';
import FeedbackSearch from './FeedbackSearch';
import NoFeedback from './NoFeedback';
import Pagination from './Pagination';

// 상태 레이블 및 색상 매핑
export const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  [PostStatusEnumDto.PENDING]: {
    label: '대기 중',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: <Clock className='h-3.5 w-3.5' />,
  },
  [PostStatusEnumDto.REVIEWING]: {
    label: '검토 중',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: <Clock className='h-3.5 w-3.5' />,
  },
  [PostStatusEnumDto.IN_PROGRESS]: {
    label: '진행 중',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: <Clock className='h-3.5 w-3.5' />,
  },
  [PostStatusEnumDto.COMPLETED]: {
    label: '완료',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className='h-3.5 w-3.5' />,
  },
  [PostStatusEnumDto.REJECTED]: {
    label: '거절됨',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: <XCircle className='h-3.5 w-3.5' />,
  },
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
  const currentCategoryNumber = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentKeyword = searchParams.get('keyword') || '';
  const currentSearchType = (searchParams.get('type') as SearchTypeEnumDto) || SearchTypeEnumDto.TITLE;

  const [allFeedbacks, setAllFeedbacks] = useState<PostSummaryResponse[]>(postsData.content || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(postsData.pageable?.totalPages || 1);
  const [totalElements, setTotalElements] = useState<number>(postsData.pageable?.totalElements || 0);

  // 검색 상태
  const [searchKeyword, setSearchKeyword] = useState<string>(currentKeyword);
  const [searchType, setSearchType] = useState<SearchTypeEnumDto>(currentSearchType);

  // 필터 상태
  const [activeFilters, setActiveFilters] = useState<{
    categoryNumber: string;
    status: string;
  }>({
    categoryNumber: currentCategoryNumber,
    status: currentStatus,
  });

  // 클라이언트 사이드에서 상태 필터링 적용
  const filteredFeedbacks = useMemo(() => {
    if (!currentStatus) {
      return allFeedbacks;
    }
    return allFeedbacks.filter((feedback) => feedback.status === currentStatus);
  }, [allFeedbacks, currentStatus]);

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

  // 데이터 새로고침 함수 (상태 필터링 제외)
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // 페이지는 API에서 0부터 시작하므로 -1
      const data = await fetchPosts(
        currentPage - 1,
        currentSize,
        currentSort,
        currentOrder,
        currentCategoryNumber, // 카테고리 번호를 직접 전달
        currentKeyword || undefined,
        currentKeyword ? currentSearchType : undefined
      );
      setAllFeedbacks(data.content || []);
      setTotalPages(data.pageable?.totalPages || 1);
      setTotalElements(data.pageable?.totalElements || 0);
    } catch (error) {
      console.error(formatToKST(new Date().toISOString()), 'Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentSize, currentSort, currentOrder, currentCategoryNumber, currentKeyword, currentSearchType]);

  // 초기 데이터 설정
  useEffect(() => {
    setAllFeedbacks(postsData.content || []);
    setTotalPages(postsData.pageable?.totalPages || 1);
    setTotalElements(postsData.pageable?.totalElements || 0);
  }, [postsData]);

  // URL 파라미터 변경 시 데이터 새로고침
  useEffect(() => {
    // 서버에서 가져온 초기 데이터가 있으면 클라이언트 사이드 페칭은 건너뜀
    if (postsData.content?.length && currentPage === 1 && currentCategoryNumber === '' && !currentKeyword) {
      return;
    }
    refreshData();
  }, [
    currentPage,
    currentSize,
    currentSort,
    currentOrder,
    currentCategoryNumber,
    currentKeyword,
    currentSearchType,
    postsData.content?.length,
    refreshData,
  ]);

  // 필터 상태 업데이트
  useEffect(() => {
    setActiveFilters({
      categoryNumber: currentCategoryNumber,
      status: currentStatus,
    });
  }, [currentCategoryNumber, currentStatus]);

  // 카테고리 필터링 함수 (숫자 기반)
  const filterByCategory = (categoryNumber: string) => {
    router.push(`/feedback?${createQueryString({ category: categoryNumber, page: '1' })}`);
  };

  // 상태 필터링 함수 (클라이언트 사이드)
  const filterByStatus = (status: string) => {
    router.push(`/feedback?${createQueryString({ status, page: '1' })}`);
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('category');
    newParams.delete('status');
    newParams.set('page', '1');
    router.push(`/feedback?${newParams.toString()}`);
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

  // 활성화된 필터가 있는지 확인
  const hasActiveFilters = activeFilters.categoryNumber || activeFilters.status;

  // 상태별 피드백 수 계산
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    Object.keys(statusConfig).forEach((status) => {
      counts[status] = allFeedbacks.filter((feedback) => feedback.status === status).length;
    });

    return counts;
  }, [allFeedbacks]);

  // 카테고리별 피드백 수 계산
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    Object.entries(numberToCategoryMap).forEach(([number, category]) => {
      counts[number] = allFeedbacks.filter((feedback) => feedback.category === category).length;
    });

    return counts;
  }, [allFeedbacks]);

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='max-w-7xl sm:px-6 sm:py-16 lg:px-8 lg:py-20 px-4 py-12 mx-auto'>
        {/* 헤더 섹션 */}
        <div className='sm:mb-12 mb-8'>
          <FeedbackListHeader />
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin border-t-transparent w-8 h-8 border-4 border-blue-500 rounded-full'></div>
          </div>
        )}

        {/* 피드백 게시판 */}
        {!loading && (
          <div className='rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm'>
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
                    하시면 피드백에 투표하는 기능을 사용할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 필터 및 검색 섹션 */}
            <div className='bg-gray-50 p-4 border-b border-gray-200'>
              <div className='sm:flex-row sm:items-start sm:justify-between flex flex-col gap-4'>
                {/* 필터 */}
                <FeedbackFilter
                  activeFilters={activeFilters}
                  filterByCategory={filterByCategory}
                  filterByStatus={filterByStatus}
                  resetFilters={resetFilters}
                  allFeedbacks={allFeedbacks}
                  categoryCounts={categoryCounts}
                  statusCounts={statusCounts}
                  hasActiveFilters={hasActiveFilters}
                />

                {/* 검색 및 정렬 */}
                <FeedbackSearch
                  searchKeyword={searchKeyword}
                  setSearchKeyword={setSearchKeyword}
                  searchType={searchType}
                  setSearchType={setSearchType}
                  currentSort={currentSort}
                  changeSort={changeSort}
                  currentOrder={currentOrder}
                  changeOrder={changeOrder}
                  handleSearch={handleSearch}
                  currentKeyword={currentKeyword}
                  resetSearch={resetSearch}
                  totalElements={totalElements}
                />
              </div>
            </div>

            {/* 피드백이 없는 경우 */}
            {filteredFeedbacks.length === 0 ? (
              <NoFeedback
                currentKeyword={currentKeyword}
                currentStatus={currentStatus}
                resetSearch={resetSearch}
                filterByStatus={filterByStatus}
              />
            ) : (
              <>
                {/* 피드백 목록 */}
                <ul className='divide-y divide-gray-100'>
                  {filteredFeedbacks.map((feedback) => (
                    <FeedbackListItem
                      key={feedback.postId}
                      feedback={feedback}
                    />
                  ))}
                </ul>

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
