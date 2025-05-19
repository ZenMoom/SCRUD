'use client';

import useAuthStore from '@/app/store/useAuthStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteComment, getComments } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse } from '@generated/model';
import dayjs from 'dayjs';
import { ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
  const { user } = useAuthStore();
  const { post, setComments } = useFeedbackStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 해당 댓글의 대댓글 가져오기
  const replies = commentMap.get(comment.commentId!) || [];
  const createdAt = dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm');

  // 현재 사용자가 댓글 작성자인지 확인
  const isAuthor = user?.username === comment.author?.username;

  // 댓글 삭제 처리
  const handleDelete = async () => {
    if (!comment.commentId) return;

    setIsDeleting(true);
    try {
      await deleteComment(comment.commentId);

      // 댓글 목록 업데이트
      if (post?.postId) {
        const updatedComments = await getComments(String(post.postId));
        setComments(updatedComments);
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글을 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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
              {comment.isUpdated && ' (수정됨)'}
            </div>
          </div>
        </div>

        {/* 삭제 버튼 - 작성자만 볼 수 있음 */}
        {isAuthenticated && isAuthor && !comment.isDeleted && (
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className='hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center justify-center w-8 h-8 transition-colors rounded-full'
            title='댓글 삭제'
          >
            <Trash2 className='w-4 h-4 text-red-500' />
          </button>
        )}
      </div>

      {/* 댓글 내용 */}
      <div className='mb-3 text-gray-700 whitespace-pre-line'>
        {comment.isDeleted ? <span className='italic text-gray-400'>삭제된 댓글입니다.</span> : comment.content}
      </div>

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
            title={!isAuthenticated ? '로그인이 필요합니다' : comment.isDeleted ? '삭제된 댓글입니다' : '좋아요'}
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
            title={!isAuthenticated ? '로그인이 필요합니다' : comment.isDeleted ? '삭제된 댓글입니다' : '싫어요'}
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

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 &quot;삭제된 댓글입니다.&quot;로 표시됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className='font-medium'
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='hover:bg-red-700 focus:ring-red-600 font-medium bg-red-600'
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
