'use client';
import useAuthStore from '@/app/store/useAuthStore';
import { CommentResponse } from '@generated/model';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

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
  return (
    <>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-3'>
          <button
            // onClick={() => handleVote(comment.commentId!, true)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated && !comment.isDeleted
                ? 'text-gray-500 hover:text-blue-600'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated || comment.isDeleted}
            title={!isAuthenticated ? '로그인이 필요합니다' : comment.isDeleted ? '삭제된 댓글입니다.' : '좋아요'}
          >
            <ThumbsUp className='w-4 h-4' />
            <span>{comment.likeCount || 0}</span>
          </button>
          <button
            // onClick={() => handleVote(comment.commentId!, false)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated && !comment.isDeleted
                ? 'text-gray-500 hover:text-red-600'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated || comment.isDeleted}
            title={!isAuthenticated ? '로그인이 필요합니다' : comment.isDeleted ? '삭제된 댓글입니다.' : '싫어요'}
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
