import { MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { statusConfig } from './FeedbackBoard';

export default function NoFeedback({
  currentKeyword,
  currentStatus,
  resetSearch,
  filterByStatus,
}: {
  currentKeyword: string;
  currentStatus: string;
  resetSearch: () => void;
  filterByStatus: (status: string) => void;
}) {
  return (
    <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
      <div className='p-4 mb-4 bg-gray-100 rounded-full'>
        <MessageSquare className='w-10 h-10 text-gray-400' />
      </div>
      <h3 className='mb-2 text-lg font-medium text-gray-800'>
        {currentKeyword ? '검색 결과가 없습니다' : '등록된 피드백이 없습니다'}
      </h3>
      <p className='max-w-md mb-6 text-gray-500'>
        {currentKeyword
          ? '다른 검색어로 다시 시도해보세요.'
          : currentStatus
          ? `'${statusConfig[currentStatus]?.label || currentStatus}' 상태의 피드백이 없습니다.`
          : '첫 번째 피드백을 작성하여 의견을 공유해보세요.'}
      </p>
      {currentKeyword ? (
        <button
          onClick={resetSearch}
          className='hover:bg-gray-200 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg'
        >
          검색 초기화
        </button>
      ) : currentStatus ? (
        <button
          onClick={() => filterByStatus('')}
          className='hover:bg-gray-200 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg'
        >
          모든 상태 보기
        </button>
      ) : (
        <Link
          href='/feedback/new'
          className='hover:bg-blue-700 flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg'
        >
          <PlusCircle className='w-5 h-5' />새 피드백 작성하기
        </Link>
      )}
    </div>
  );
}
