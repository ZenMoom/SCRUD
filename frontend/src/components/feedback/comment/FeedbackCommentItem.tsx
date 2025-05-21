'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { deleteComment, getComments, updateComment } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { formatToKST } from '@/util/dayjs';
import type { CommentResponse } from '@generated/model';
import dayjs from 'dayjs';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import FeedbackCommentContent from './FeedbackCommentContent';
import FeedbackCommentDelete from './FeedbackCommentDelete';
import FeedbackCommentEdit from './FeedbackCommentEdit';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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
      console.error(formatToKST(new Date().toISOString()), '댓글 삭제 실패:', error);
      alert('댓글을 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 댓글 수정 모드 시작
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(comment.content || '');
  };

  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content || '');
  };

  // 댓글 수정 저장
  const handleSaveEdit = async () => {
    if (!comment.commentId) return;
    if (!editedContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await updateComment(comment.commentId, editedContent);

      // 댓글 목록 업데이트
      if (post?.postId) {
        const updatedComments = await getComments(String(post.postId));
        setComments(updatedComments);
      }
      setIsEditing(false);
    } catch (error) {
      console.error(formatToKST(new Date().toISOString()), '댓글 수정 실패:', error);
      alert('댓글을 수정하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingEdit(false);
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

        {/* 수정/삭제 버튼 - 작성자만 볼 수 있음 */}
        {isAuthenticated && isAuthor && !comment.isDeleted && !isEditing && (
          <div className='flex items-center gap-1'>
            <button
              onClick={handleStartEdit}
              className='hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center justify-center w-8 h-8 transition-colors rounded-full'
              title='댓글 수정'
            >
              <Pencil className='w-4 h-4 text-blue-500' />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className='hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center justify-center w-8 h-8 transition-colors rounded-full'
              title='댓글 삭제'
            >
              <Trash2 className='w-4 h-4 text-red-500' />
            </button>
          </div>
        )}
      </div>

      {/* 댓글 내용 */}
      {isEditing ? (
        <div className='mb-3'>
          <FeedbackCommentEdit
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            isSubmittingEdit={isSubmittingEdit}
          />
        </div>
      ) : (
        <div className='mb-3 text-gray-700 whitespace-pre-line'>
          {comment.isDeleted ? <span className='italic text-gray-400'>삭제된 댓글입니다.</span> : comment.content}
        </div>
      )}

      {/* 수정 중이 아닐 때 댓글 내용 */}
      {!isEditing && (
        <FeedbackCommentContent
          comment={comment}
          isReply={isReply}
          handleReply={handleReply}
        />
      )}

      {/* 대댓글 렌더링 */}
      {replies.length > 0 && !isEditing && (
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
      <FeedbackCommentDelete
        handleDelete={handleDelete}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isDeleting={isDeleting}
      />
    </div>
  );
}
