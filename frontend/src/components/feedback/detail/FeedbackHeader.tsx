'use client';

import { useFeedbackStore } from '@/store/useFeedbackStore';
import dayjs from 'dayjs';
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
  const createdAt = dayjs(post.createdAt).format('YYYY.MM.DD HH:mm');
  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        {/* 타이틀 */}
        <h1 className='text-2xl font-bold text-gray-900'>{post.title}</h1>
        {post.category && categoryConfig[post.category] && (
          <span className={`text-sm px-3 py-1 rounded-full ${categoryConfig[post.category].color}`}>
            {categoryConfig[post.category].label}
          </span>
        )}
      </div>

      {/* 작성자 정보 */}
      {post.author && (
        <div className='flex items-center gap-3 mb-4'>
          <div className='relative w-10 h-10 overflow-hidden bg-gray-200 rounded-full'>
            {post.author.profileImgUrl ? (
              <Image
                src={post.author.profileImgUrl || '/placeholder.svg'}
                alt={post.author.nickname || '사용자'}
                width={40}
                height={40}
                className='object-cover'
              />
            ) : (
              <div className='flex items-center justify-center w-full h-full text-gray-500'>
                {post.author.nickname?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className='font-medium text-gray-900'>{post.author.nickname}</div>
            <div className='text-sm text-gray-500'>
              {createdAt}
              {post.isUpdated && ' (수정됨)'}
            </div>
          </div>
        </div>
      )}

      {/* 조회수 및 투표 정보 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4 text-sm text-gray-500'>
          <span>조회 {post.viewCount}</span>
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
    </>
  );
};
