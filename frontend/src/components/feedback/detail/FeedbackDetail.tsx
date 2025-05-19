'use client';

import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse, PostDetailResponse } from '@generated/model';
import { useEffect } from 'react';
import FeedbackBackButton from '../FeedbackBackButton';
import FeedbackComment from '../comment/FeedbackComment';
import FeedbackActions from './FeedbackActions';
import { FeedbackHeader } from './FeedbackHeader';
import FeedbackStatusChanger from './FeedbackStatusChanger';
import FeedbackVote from './FeedbackVote';

// 상태 레이블 및 색상 매핑
// const statusConfig: Record<string, { label: string; color: string }> = {
//   pending: { label: '대기 중', color: 'bg-gray-100 text-gray-800' },
//   reviewing: { label: '검토 중', color: 'bg-yellow-100 text-yellow-800' },
//   inprogress: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
//   completed: { label: '완료', color: 'bg-green-100 text-green-800' },
//   rejected: { label: '거절됨', color: 'bg-red-100 text-red-800' },
// };

// 피드백 헤더

export default function FeedbackDetail({
  feedback,
  initialComments,
}: {
  feedback: PostDetailResponse;
  initialComments: CommentResponse[];
}) {
  const { post, setPost, setComments } = useFeedbackStore();

  useEffect(() => {
    setPost(feedback);
    setComments(initialComments);
  }, [feedback, setPost, initialComments, setComments]);

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='md:px-6 md:py-12 lg:py-16 max-w-4xl px-4 py-6 mx-auto'>
        {/* 뒤로 가기 링크 */}
        <FeedbackBackButton description='피드백 목록으로 돌아가기' />

        <div className='rounded-xl mt-4 overflow-hidden bg-white border border-gray-100 shadow-sm'>
          {/* 피드백 헤더 */}
          <div className='p-6 border-b border-gray-100'>
            <div className='flex items-start justify-between gap-4 mb-6'>
              <FeedbackHeader />
              {/* 작성자만 볼 수 있는 수정/삭제 버튼 */}
              <FeedbackActions />
            </div>
            {/*  상태 컴포넌트 */}
            <FeedbackStatusChanger />
          </div>

          {/* 피드백 내용 */}
          <div className='p-6 border-b border-gray-100'>
            <div className='max-w-none prose'>
              {post &&
                post.content?.split('\n').map((paragraph, idx) => (
                  <p
                    key={idx}
                    className='last:mb-0 mb-4 text-gray-700'
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>

          {/* 투표 버튼 */}
          <div className='p-6 border-b border-gray-100'>
            <FeedbackVote />
          </div>

          {/* 댓글 세션 */}
          <FeedbackComment />
        </div>
      </div>
    </div>
  );
}
