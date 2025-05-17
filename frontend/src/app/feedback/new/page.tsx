'use client';

import type React from 'react';

import { createPost } from '@/lib/feedback-api';
import { CreatePostRequest } from '@generated/model';
import { ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

// 카테고리 옵션
const categoryOptions = [
  { id: 1, value: 'feature', label: '기능 요청', description: '새로운 기능이나 서비스를 제안합니다.' },
  { id: 2, value: 'bug', label: '버그 리포트', description: '발견한 오류나 문제점을 알려주세요.' },
  { id: 3, value: 'improvement', label: '개선 제안', description: '기존 기능의 개선 아이디어를 공유합니다.' },
  { id: 4, value: 'question', label: '질문', description: '서비스 이용 중 궁금한 점을 물어보세요.' },
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(1);
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 로그인한 경우 사용자 이름 자동 설정
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user?.username) {
      setAuthorName(user.username);
    }
  }, [isAuthenticated, user, router]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (title.length < 5) {
      newErrors.title = '제목은 5자 이상이어야 합니다.';
    }

    if (!content.trim()) {
      newErrors.content = '내용을 입력해주세요.';
    } else if (content.length < 10) {
      newErrors.content = '내용은 10자 이상이어야 합니다.';
    }

    if (!authorName.trim() && !isAuthenticated) {
      newErrors.authorName = '이름을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: CreatePostRequest = {
        title,
        content,
        categoryId: category,
      };

      const res = await createPost(postData);

      // 피드백 목록 페이지로 이동
      router.push(`/feedback/${res.postId}`);
    } catch (error) {
      console.error('피드백 등록 중 오류 발생:', error);
      alert('피드백 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen py-12'>
      <div className='max-w-3xl px-6 mx-auto'>
        {/* 헤더 */}
        <div className='mb-8'>
          <button
            onClick={() => router.back()}
            className='hover:text-gray-900 inline-flex items-center mb-4 text-gray-600 transition-colors'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            <span>피드백 목록으로 돌아가기</span>
          </button>
          <h1 className='text-3xl font-bold text-gray-800'>새 피드백 작성</h1>
          <p className='mt-2 text-gray-600'>서비스 개선을 위한 의견이나 제안을 자유롭게 작성해주세요.</p>
        </div>

        {/* 피드백 작성 폼 */}
        <div className='rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm'>
          <form
            onSubmit={handleSubmit}
            className='p-6'
          >
            {/* 카테고리 선택 */}
            <div className='mb-6'>
              <label className='block mb-2 font-medium text-gray-700'>카테고리</label>
              <div className='sm:grid-cols-2 grid grid-cols-1 gap-3'>
                {categoryOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      category === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCategory(option.id)}
                  >
                    <div className='font-medium text-gray-800'>{option.label}</div>
                    <div className='mt-1 text-sm text-gray-500'>{option.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 제목 입력 */}
            <div className='mb-6'>
              <label
                htmlFor='title'
                className='block mb-2 font-medium text-gray-700'
              >
                제목
              </label>
              <input
                type='text'
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='피드백의 제목을 입력해주세요'
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.title && <p className='mt-1 text-sm text-red-500'>{errors.title}</p>}
            </div>

            {/* 내용 입력 */}
            <div className='mb-6'>
              <label
                htmlFor='content'
                className='block mb-2 font-medium text-gray-700'
              >
                내용
              </label>
              <textarea
                id='content'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='피드백 내용을 자세히 작성해주세요'
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.content ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.content && <p className='mt-1 text-sm text-red-500'>{errors.content}</p>}
            </div>

            {/* 작성자 이름 (로그인하지 않은 경우에만 표시) */}
            {!isAuthenticated && (
              <div className='mb-6'>
                <label
                  htmlFor='authorName'
                  className='block mb-2 font-medium text-gray-700'
                >
                  이름
                </label>
                <input
                  type='text'
                  id='authorName'
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder='이름을 입력해주세요 (익명으로 표시하려면 비워두세요)'
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.authorName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.authorName && <p className='mt-1 text-sm text-red-500'>{errors.authorName}</p>}
                <p className='mt-1 text-sm text-gray-500'>이름을 입력하지 않으면 &apos;익명&apos;으로 표시됩니다.</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className='flex justify-end'>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Send className='w-4 h-4' />
                {isSubmitting ? '제출 중...' : '피드백 제출하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
