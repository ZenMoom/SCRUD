import { categoryConfig } from '@/types/feedback';
import { formatToKST } from '@/util/dayjs';
import { PostSummaryResponse } from '@generated/model';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { statusConfig } from './FeedbackBoard';

export default function FeedbackListItem({ feedback }: { feedback: PostSummaryResponse }) {
  return (
    <>
      <li
        key={feedback.postId}
        className='group hover:bg-gray-50 transition-colors'
      >
        <Link
          href={`/feedback/${feedback.postId}`}
          className='block p-5'
        >
          <div className='sm:flex-row sm:items-start sm:justify-between flex flex-col'>
            <div className='sm:mb-0 sm:pr-6 mb-3'>
              {/* 피드백 제목 및 카테고리 */}
              <div className='flex flex-wrap items-center gap-2 mb-2'>
                <h3 className='group-hover:text-blue-600 text-lg font-medium text-gray-900'>{feedback.title}</h3>
                {feedback.category && categoryConfig[feedback.category as keyof typeof categoryConfig] && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoryConfig[feedback.category as keyof typeof categoryConfig].color
                    }`}
                  >
                    {categoryConfig[feedback.category as keyof typeof categoryConfig].label}
                  </span>
                )}
                {/* 상태 표시 */}
                {feedback.status && statusConfig[feedback.status] && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusConfig[feedback.status].bgColor
                    } ${statusConfig[feedback.status].color}`}
                  >
                    {statusConfig[feedback.status].icon}
                    {statusConfig[feedback.status].label}
                  </span>
                )}
              </div>

              {/* 작성 날짜 및 조회수 */}
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <span>{formatToKST(feedback.createdAt!)}</span>
                <span>•</span>
                <span>조회 {feedback.viewCount}</span>
              </div>
            </div>

            {/* 투표 및 댓글 수 */}
            <div className='sm:self-center flex items-center self-end gap-4'>
              {/* 좋아요 */}
              <div className='flex items-center gap-1 text-sm text-gray-500'>
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
        </Link>
      </li>
    </>
  );
}
