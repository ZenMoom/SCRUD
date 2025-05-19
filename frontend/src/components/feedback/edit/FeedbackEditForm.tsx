'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { updatePost } from '@/lib/feedback-api';
import { PostDetailResponse } from '@generated/model';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FeedbackBackButton from '../FeedbackBackButton';

interface FeedbackEditFormProps {
  post: PostDetailResponse;
}

export default function FeedbackEditForm({ post }: FeedbackEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [category, setCategory] = useState(post.category || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  if (!user || post.author?.username !== user.username) {
    router.back();
    return;
  }

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // API 호출하여 피드백 업데이트
      await updatePost(post.postId!, {
        title,
        content,
      });

      // 성공 시  상세 페이지로 리다이렉트
      router.push(`/feedback/${post.postId}`);
      router.refresh(); // 캐시된 데이터 갱신
    } catch (err) {
      console.error('Failed to update feedback:', err);
      setError('피드백 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm'>
      {/* 뒤로 가기 링크 */}
      <div className='p-6 border-b border-gray-100'>
        <FeedbackBackButton description='피드백으로 돌아가기' />
      </div>

      {/* 수정 폼 */}
      <form
        onSubmit={handleSubmit}
        className='p-6'
      >
        {/* 에러 메시지 */}
        {error && <div className='bg-red-50 p-4 mb-6 text-red-700 rounded-lg'>{error}</div>}

        {/* 제목 입력 */}
        <div className='mb-6'>
          <label
            htmlFor='title'
            className='block mb-2 text-sm font-medium text-gray-700'
          >
            제목
          </label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-4 py-2 border border-gray-300 rounded-md'
            placeholder='피드백 제목을 입력하세요'
            disabled={isSubmitting}
          />
        </div>

        {/* 카테고리 선택 */}
        <div className='mb-6'>
          <label
            htmlFor='category'
            className='block mb-2 text-sm font-medium text-gray-700'
          >
            카테고리
          </label>
          <select
            id='category'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-4 py-2 border border-gray-300 rounded-md'
            disabled={true}
          >
            <option value='feature'>기능 요청</option>
            <option value='bug'>버그 리포트</option>
            <option value='improvement'>개선 제안</option>
            <option value='question'>질문</option>
          </select>
        </div>

        {/* 내용 입력 */}
        <div className='mb-6'>
          <label
            htmlFor='content'
            className='block mb-2 text-sm font-medium text-gray-700'
          >
            내용
          </label>
          <textarea
            id='content'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-4 py-2 border border-gray-300 rounded-md'
            placeholder='피드백 내용을 자세히 작성해주세요'
            rows={8}
            disabled={isSubmitting}
          />
        </div>

        {/* 버튼 그룹 */}
        <div className='flex justify-end gap-3'>
          <Link
            href={`/feedback/${post.postId}`}
            className='hover:bg-gray-200 px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-md'
          >
            취소
          </Link>
          <button
            type='submit'
            className='hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed px-4 py-2 text-white transition-colors bg-blue-500 rounded-md'
            disabled={isSubmitting}
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}
