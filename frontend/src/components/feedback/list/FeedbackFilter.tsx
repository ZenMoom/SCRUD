import { categoryConfig } from '@/types/feedback';
import { PostSummaryResponse } from '@generated/model';
import { statusConfig } from './FeedbackBoard';

export default function FeedbackFilter({
  activeFilters,
  filterByCategory,
  filterByStatus,
  resetFilters,
  allFeedbacks,
  categoryCounts,
  statusCounts,
  hasActiveFilters,
}: {
  activeFilters: {
    categoryNumber: string;
    status: string;
  };
  filterByCategory: (categoryNumber: string) => void;
  filterByStatus: (status: string) => void;
  resetFilters: () => void;
  allFeedbacks: PostSummaryResponse[];
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  hasActiveFilters: string;
}) {
  return (
    <div>
      <div className='space-y-4'>
        {/* 카테고리 필터 (숫자 기반) */}
        <div>
          <h3 className='mb-2 text-sm font-medium text-gray-700'>카테고리</h3>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => filterByCategory('')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilters.categoryNumber === ''
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({allFeedbacks.length})
            </button>
            {Object.entries(categoryConfig).map(([key, { label, color, number }]) => (
              <button
                key={key}
                onClick={() => filterByCategory(number)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeFilters.categoryNumber === number ? color : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({categoryCounts[number] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* 상태 필터 (클라이언트 사이드) */}
        <div>
          <h3 className='mb-2 text-sm font-medium text-gray-700'>상태</h3>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => filterByStatus('')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilters.status === ''
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({allFeedbacks.length})
            </button>
            {Object.entries(statusConfig).map(([key, { label, color, bgColor }]) => (
              <button
                key={key}
                onClick={() => filterByStatus(key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeFilters.status === key ? `${bgColor} ${color}` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({statusCounts[key] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* 필터 초기화 버튼 */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className='hover:text-blue-800 hover:underline text-sm text-blue-600'
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
}
