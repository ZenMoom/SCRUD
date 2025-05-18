'use client';

import { CommentResponse } from '@generated/model';
import dayjs from 'dayjs';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';

interface FeedbackCommentItemProps {
  comment: CommentResponse;
  isReply?: boolean;
  commentMap: Map<number, CommentResponse[]>;
  isAuthenticated: boolean;
  handleReply: (comment: CommentResponse) => void;
}

export default function FeedbackCommentItem({
  comment,
  isReply = false,
  commentMap,
  isAuthenticated,
  handleReply,
}: FeedbackCommentItemProps) {
  // 해당 댓글의 대댓글 가져오기
  const replies = commentMap.get(comment.commentId!) || [];
  const createdAt = dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm');

  return (
    <div
      className={`p-4 rounded-lg ${
        isReply ? 'ml-8 mt-3 bg-gray-50 border border-gray-100' : 'mb-4 bg-white border border-gray-200'
      }`}
    >
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-3'>
          <div className='relative w-8 h-8 overflow-hidden bg-gray-200 rounded-full'>
            {comment.author?.profileImgUrl ? (
              <Image
                src={comment.author.profileImgUrl || '/placeholder.svg'}
                alt={comment.author.nickname || '사용자'}
                width={32}
                height={32}
                className='object-cover'
              />
            ) : (
              <div className='flex items-center justify-center w-full h-full text-gray-500'>
                {comment.author?.nickname?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <span className='font-medium text-gray-900'>{comment.author?.nickname || '익명'}</span>
            <div className='text-xs text-gray-500'>
              {createdAt}
              {comment.isEdited && ' (수정됨)'}
            </div>
          </div>
        </div>
      </div>

      <div className='mb-3 text-gray-700 whitespace-pre-line'>{comment.content}</div>

      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-3'>
          <button
            // onClick={() => handleVote(comment.commentId!, true)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated ? 'text-gray-500 hover:text-blue-600' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
            title={isAuthenticated ? '좋아요' : '로그인이 필요합니다'}
          >
            <ThumbsUp className='w-4 h-4' />
            <span>{comment.likeCount || 0}</span>
          </button>
          <button
            // onClick={() => handleVote(comment.commentId!, false)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated ? 'text-gray-500 hover:text-red-600' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
            title={isAuthenticated ? '싫어요' : '로그인이 필요합니다'}
          >
            <ThumbsDown className='w-4 h-4' />
            <span>{comment.dislikeCount || 0}</span>
          </button>
        </div>
        {!isReply && (
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

      {/* 대댓글 렌더링 */}
      {replies.length > 0 && (
        <div className='mt-3 space-y-3'>
          {replies.map((reply) => (
            <FeedbackCommentItem
              key={reply.commentId}
              comment={reply}
              isReply={true}
              commentMap={commentMap}
              isAuthenticated={isAuthenticated}
              handleReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
