'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { commentVote } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse } from '@generated/model';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function FeedbackCommentContent({
  comment,
  isReply = false,
  handleReply,
}: {
  comment: CommentResponse;
  isReply?: boolean;
  handleReply: (comment: CommentResponse) => void;
}) {
  const { isAuthenticated } = useAuthStore();
  const { updateCommentVoteCounts } = useFeedbackStore();
  const [isVoting, setIsVoting] = useState<{ [key: string]: boolean }>({});

  const handleVote = async (commentId: number, isLike: boolean) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.', {
        description: '댓글에 투표하려면 로그인 후 이용해주세요.',
        duration: 3000,
      });
      return;
    }

    // 이미 투표 중인 경우 중복 요청 방지
    const voteKey = `${commentId}-${isLike ? 'like' : 'dislike'}`;
    if (isVoting[voteKey]) return;

    setIsVoting((prev) => ({ ...prev, [voteKey]: true }));

    // 로딩 토스트 ID (나중에 업데이트하기 위함)
    const loadingToastId = toast.loading(isLike ? '좋아요 처리 중...' : '싫어요 처리 중...');

    try {
      const res = await commentVote(commentId, isLike);

      // 투표 처리 후 댓글 목록 업데이트
      updateCommentVoteCounts(comment.commentId!, res.likeCount, res.dislikeCount);

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
        description: errorMessage!,
        duration: 4000,
      });
    } finally {
      setIsVoting((prev) => ({ ...prev, [voteKey]: false }));
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

  useEffect(() => {
    console.log('comment:', comment);
  }, [comment]);

  return (
    <>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => handleVote(comment.commentId!, true)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated && !comment.isDeleted
                ? isVoting[`${comment.commentId}-like`]
                  ? 'text-gray-400'
                  : comment.userVote === 'LIKE'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated || comment.isDeleted || isVoting[`${comment.commentId}-like`]}
            title={
              !isAuthenticated
                ? '로그인이 필요합니다'
                : comment.isDeleted
                ? '삭제된 댓글입니다.'
                : isVoting[`${comment.commentId}-like`]
                ? '처리 중...'
                : '좋아요'
            }
          >
            <ThumbsUp className='w-4 h-4' />
            <span>{comment.likeCount || 0}</span>
          </button>
          <button
            onClick={() => handleVote(comment.commentId!, false)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated && !comment.isDeleted
                ? isVoting[`${comment.commentId}-dislike`]
                  ? 'text-gray-400'
                  : comment.userVote === 'DISLIKE'
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-red-600'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated || comment.isDeleted || isVoting[`${comment.commentId}-dislike`]}
            title={
              !isAuthenticated
                ? '로그인이 필요합니다'
                : comment.isDeleted
                ? '삭제된 댓글입니다.'
                : isVoting[`${comment.commentId}-dislike`]
                ? '처리 중...'
                : '싫어요'
            }
          >
            <ThumbsDown className='w-4 h-4' />
            <span>{comment.dislikeCount || 0}</span>
          </button>
        </div>
        {!isReply && !comment.isDeleted && (
          <button
            onClick={() => handleReply(comment)}
            className={`text-sm ${
              isAuthenticated ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
            title={isAuthenticated ? '답글 달기' : '로그인이 필요합니다'}
          >
            답글 달기
          </button>
        )}
      </div>
    </>
  );
}
