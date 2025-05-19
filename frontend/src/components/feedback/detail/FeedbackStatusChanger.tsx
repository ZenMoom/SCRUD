'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { updatePostStatus } from '@/lib/feedback-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { PostStatusEnumDto } from '@generated/model';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// 상태 레이블 및 색상 매핑
const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  [PostStatusEnumDto.PENDING]: {
    label: '대기 중',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: 'bg-gray-500',
  },
  [PostStatusEnumDto.REVIEWING]: {
    label: '검토 중',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: 'bg-yellow-500',
  },
  [PostStatusEnumDto.IN_PROGRESS]: {
    label: '진행 중',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: 'bg-blue-500',
  },
  [PostStatusEnumDto.COMPLETED]: {
    label: '완료',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: 'bg-green-500',
  },
  [PostStatusEnumDto.REJECTED]: {
    label: '거절됨',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: 'bg-red-500',
  },
};

export default function FeedbackStatusChanger() {
  const { user } = useAuthStore();
  const { post, updatePostStatusInStore } = useFeedbackStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!post || !user) {
    return null;
  }

  const isAdmin = user.role === ('ADMIN' as PostStatusEnumDto);
  const currentStatus = post.status || PostStatusEnumDto.PENDING;
  const statusInfo = statusConfig[currentStatus];

  const handleStatusChange = async (newStatus: string) => {
    if (!post.postId) return;
    if (!isAdmin) return;
    if (newStatus === currentStatus || isUpdating) return;

    setIsUpdating(true);
    try {
      await updatePostStatus(post.postId!, newStatus as PostStatusEnumDto);
      updatePostStatusInStore(newStatus as PostStatusEnumDto);
      toast.success('피드백 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('상태 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium text-gray-700'>피드백 상태</h3>

        <div className='relative'>
          {/* 현재 상태 표시 */}
          <div className='flex items-center'>
            <div className={`inline-flex items-center ${!isAdmin ? 'pointer-events-none' : ''}`}>
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} transition-all`}
              >
                <span className={`w-2 h-2 rounded-full ${statusInfo.icon} mr-1.5`}></span>
                <span>{statusInfo.label}</span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  disabled={isUpdating}
                  className='hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 p-1 ml-1 transition-colors rounded-md'
                >
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* 상태 업데이트 중 로딩 표시 */}
            {isUpdating && (
              <div className='ml-2'>
                <Loader2 className='animate-spin w-4 h-4 text-gray-500' />
              </div>
            )}
          </div>

          {/* 상태 변경 드롭다운 */}
          {isOpen && !isUpdating && isAdmin && (
            <div className='ring-1 ring-black ring-opacity-5 focus:outline-none absolute right-0 z-10 w-48 mt-1 origin-top-right bg-white rounded-md shadow-lg'>
              <div className='py-1'>
                {Object.entries(PostStatusEnumDto).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(value)}
                    className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                      value === currentStatus
                        ? `${statusConfig[value].color} ${statusConfig[value].bgColor}`
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center flex-1'>
                      <span className={`w-2 h-2 rounded-full ${statusConfig[value].icon} mr-1.5`}></span>
                      <span>{statusConfig[value].label}</span>
                    </div>
                    {value === currentStatus && <Check className='w-4 h-4 ml-2' />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
