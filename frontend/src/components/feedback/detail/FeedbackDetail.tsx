'use client';

import { getComments } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { PostDetailResponse } from '@generated/model';
import { useEffect } from 'react';
import FeedbackBackButton from '../FeedbackBackButton';
import FeedbackComment from '../comment/FeedbackComment';
import FeedbackActions from './FeedbackActions';
import { FeedbackHeader } from './FeedbackHeader';
import FeedbackStatusChanger from './FeedbackStatusChanger';
import FeedbackVote from './FeedbackVote';

export default function FeedbackDetail({ feedback }: { feedback: PostDetailResponse }) {
  const { post, setPost, setComments } = useFeedbackStore();

  useEffect(() => {
    if (!feedback) return;
    setPost(feedback);
    const comments = async () => {
      const res = await getComments(String(feedback.postId));
      setComments(res);
    };
    comments();
  }, [feedback, setPost, setComments]);

  const isNotice = post?.category === 'notice';

  return (
    <div className={`bg-gradient-to-b from-white to-gray-50 min-h-screen ${isNotice ? 'from-yellow-50 to-white' : ''}`}>
      <div className='md:px-6 md:py-12 lg:py-16 max-w-4xl px-4 py-6 mx-auto'>
        {/* 뒤로 가기 링크 */}
        <FeedbackBackButton description='피드백 목록으로 돌아가기' />

        <div
          className={`rounded-xl mt-4 overflow-hidden bg-white border shadow-sm ${
            isNotice ? 'border-yellow-200' : 'border-gray-100'
          }`}
        >
          {/* 피드백 헤더 */}
          <div className={`p-6 border-b ${isNotice ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
            <div className='flex items-start justify-between gap-4 mb-6'>
              <FeedbackHeader />
              {/* 작성자만 볼 수 있는 수정/삭제 버튼 */}
              <FeedbackActions />
            </div>
            {/*  상태 컴포넌트 */}
            <div className={`${isNotice ? 'hidden' : 'block'}`}>
              <FeedbackStatusChanger />
            </div>
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
