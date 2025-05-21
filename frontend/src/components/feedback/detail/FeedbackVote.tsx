'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { votePost } from '@/lib/feedback-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function FeedbackVote() {
  const { isAuthenticated } = useAuthStore();
  const { post, updateVoteCounts } = useFeedbackStore();
  const [isVoting, setIsVoting] = useState<{ like: boolean; dislike: boolean }>({
    like: false,
    dislike: false,
  });

  if (!post) {
    return null;
  }

  // 투표 처리 함수
  const handleVote = async (isLike: boolean) => {
    // 로그인하지 않은 경우 알림
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다', {
        description: '피드백에 투표하려면 로그인 후 이용해주세요.',
        duration: 3000,
      });
      return;
    }

    // 이미 투표 중인 경우 중복 요청 방지
    if (isVoting[isLike ? 'like' : 'dislike']) {
      return;
    }

    // 투표 상태 업데이트
    setIsVoting((prev) => ({
      ...prev,
      [isLike ? 'like' : 'dislike']: true,
    }));

    // 로딩 토스트 ID (나중에 업데이트하기 위함)
    const loadingToastId = toast.loading(isLike ? '좋아요 처리 중...' : '싫어요 처리 중...');

    try {
      const response = await votePost(post.postId!, { isLike });

      if (!response) {
        throw new Error('투표 처리에 실패했습니다.');
      }

      // 투표 카운트 업데이트
      updateVoteCounts(response.likeCount!, response.dislikeCount!);

      // 로딩 토스트를 성공 토스트로 업데이트
      toast.success(isLike ? '좋아요를 표시했습니다.' : '싫어요를 표시했습니다.', {
        id: loadingToastId,
        duration: 2000,
      });
    } catch (error) {
      // 에러 메시지 추출
      const errorMessage = getErrorMessage(error);

      // 로딩 토스트를 에러 토스트로 업데이트
      toast.error('투표 처리 실패', {
        id: loadingToastId,
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      // 투표 상태 초기화
      setIsVoting((prev) => ({
        ...prev,
        [isLike ? 'like' : 'dislike']: false,
      }));
    }
  };

  // 에러 메시지 추출 함수
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message: string }).message);
    } else if (typeof error === 'string') {
      return error;
    }
    return '투표 처리 중 오류가 발생했습니다.';
  };

  return (
    <div className='flex items-center justify-center gap-4'>
      <button
        onClick={() => handleVote(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          !isAuthenticated
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : isVoting.like
            ? 'bg-gray-100 text-gray-500'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        }`}
        disabled={!isAuthenticated || isVoting.like}
        title={!isAuthenticated ? '좋아요하려면 로그인하세요' : isVoting.like ? '처리 중...' : '좋아요'}
      >
        <ThumbsUp className='w-5 h-5' />
        <span>좋아요 {post.likeCount}</span>
      </button>
      <button
        onClick={() => handleVote(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          !isAuthenticated
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : isVoting.dislike
            ? 'bg-gray-100 text-gray-500'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
        disabled={!isAuthenticated || isVoting.dislike}
        title={!isAuthenticated ? '싫어요하려면 로그인하세요' : isVoting.dislike ? '처리 중...' : '싫어요'}
      >
        <ThumbsDown className='w-5 h-5' />
        <span>싫어요 {post.dislikeCount}</span>
      </button>
    </div>
  );
}
