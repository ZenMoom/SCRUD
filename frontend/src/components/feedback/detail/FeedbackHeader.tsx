'use client';

import { useFeedbackStore } from '@/store/useFeedbackStore';
import { formatToKST } from '@/util/dayjs';
import { MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';

// 카테고리 레이블 및 색상 매핑
const categoryConfig: Record<string, { label: string; color: string }> = {
  feature: { label: '기능 요청', color: 'bg-blue-100 text-blue-800' },
  bug: { label: '버그 리포트', color: 'bg-red-100 text-red-800' },
  improvement: { label: '개선 제안', color: 'bg-green-100 text-green-800' },
  question: { label: '질문', color: 'bg-purple-100 text-purple-800' },
};

export const FeedbackHeader = () => {
  const { post } = useFeedbackStore();
  if (!post) return null;

  return (
    <div className='w-full'>
      <div className='sm:flex-row sm:items-center sm:justify-between flex flex-col gap-2 mb-4'>
        {/* 타이틀 */}
        <h1 className='md:text-2xl text-xl font-bold leading-tight text-gray-900'>{post.title}</h1>
        {post.category && categoryConfig[post.category] && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              categoryConfig[post.category].color
            }`}
          >
            {categoryConfig[post.category].label}
          </span>
        )}
      </div>

      {/* 작성자 정보 */}
      {post.author && (
        <div className='flex items-center gap-3 mb-4'>
          <div className='relative flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 rounded-full'>
            {post.author.profileImgUrl ? (
              <Image
                src={post.author.profileImgUrl || '/placeholder.svg'}
                alt={post.author.nickname || '사용자'}
                width={40}
                height={40}
                className='object-cover'
              />
            ) : (
              <div className='flex items-center justify-center w-full h-full font-medium text-gray-500'>
                {post.author.nickname?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className='font-medium text-gray-900'>{post.author.nickname}</div>
            <div className='flex items-center gap-1 text-xs text-gray-500'>
              <span>{formatToKST(post.createdAt!)}</span>
              {post.isUpdated && <span className='text-gray-400'>(수정됨)</span>}
            </div>
          </div>
        </div>
      )}

      {/* 조회수 및 투표 정보 */}
      <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
        <span className='flex items-center'>조회 {post.viewCount}</span>
        <div className='flex items-center gap-1'>
          <ThumbsUp className='w-4 h-4' />
          <span>{post.likeCount}</span>
        </div>
        <div className='flex items-center gap-1'>
          <ThumbsDown className='w-4 h-4' />
          <span>{post.dislikeCount}</span>
        </div>
        <div className='flex items-center gap-1'>
          <MessageSquare className='w-4 h-4' />
          <span>{post.commentCount}</span>
        </div>
      </div>
    </div>
  );
};
