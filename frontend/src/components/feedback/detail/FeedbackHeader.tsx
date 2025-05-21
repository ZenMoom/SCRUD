'use client';

import { useFeedbackStore } from '@/store/useFeedbackStore';
import { categoryConfig } from '@/types/feedback';
import dayjs from '@/util/dayjs';
import { User } from 'lucide-react';

export function FeedbackHeader() {
  const { post } = useFeedbackStore();

  if (!post) return null;

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        {post.category === 'notice' && <span className='mr-1 text-lg font-medium text-yellow-600'>📢</span>}
        <h1 className={`text-xl font-bold ${post.category === 'notice' ? 'text-yellow-800' : 'text-gray-900'}`}>
          {post.title}
        </h1>
        {post.category && categoryConfig[post.category as keyof typeof categoryConfig] && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              categoryConfig[post.category as keyof typeof categoryConfig].color
            }`}
          >
            {categoryConfig[post.category as keyof typeof categoryConfig].label}
          </span>
        )}
      </div>
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <div className='gap-1.5 flex items-center'>
          <User className='w-3.5 h-3.5' />
          <span>{post.author?.nickname}</span>
        </div>
        <span>•</span>
        <span>{dayjs(post.createdAt).tz().format('YYYY년 MM월 DD일 HH:mm')}</span>
        <span>•</span>
        <span>조회 {post.viewCount}</span>
      </div>
    </div>
  );
}
