'use client';

import useAuthStore from '@/app/store/useAuthStore';
import AlertLogin from '@/components/alert/AlertLogin';
import { votePost } from '@/lib/feedback-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

export default function FeedbackVote() {
  const { isAuthenticated } = useAuthStore();
  const { post, updateVoteCounts } = useFeedbackStore();
  if (!post) {
    return null;
  }

  // 투표 처리 함수
  const handleVote = async (isLike: boolean) => {
    // 로그인하지 않은 경우 알림
    if (!isAuthenticated) {
      <AlertLogin />;
      return;
    }

    try {
      const response = await votePost(post.postId!, { isLike });
      if (!response) {
        console.error('투표 처리 실패');
        return;
      }
      updateVoteCounts(response.likeCount!, response.dislikeCount!);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className='flex items-center justify-center gap-4'>
      <button
        onClick={() => handleVote(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          isAuthenticated ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        disabled={!isAuthenticated}
        title={isAuthenticated ? '좋아요' : '좋아요하려면 로그인하세요'}
      >
        <ThumbsUp className='w-5 h-5' />
        <span>좋아요 {post.likeCount}</span>
      </button>
      <button
        onClick={() => handleVote(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md ${
          isAuthenticated ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        disabled={!isAuthenticated}
        title={isAuthenticated ? '싫어요' : '싫어요하려면 로그인하세요'}
      >
        <ThumbsDown className='w-5 h-5' />
        <span>싫어요 {post.dislikeCount}</span>
      </button>
    </div>
  );
}
