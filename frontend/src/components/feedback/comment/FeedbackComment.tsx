'use client';

import type React from 'react';

import useAuthStore from '@/app/store/useAuthStore';
import AlertLogin from '@/components/alert/AlertLogin';
import { createComment } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse } from '@generated/model';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function FeedbackComment() {
  const { isAuthenticated } = useAuthStore();
  const { post, comments, setComments, updateCommentCount } = useFeedbackStore();

  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<CommentResponse | null>(null);
  const [commentMap, setCommentMap] = useState<Map<number, CommentResponse[]>>(new Map());

  const [topLevelComments, setTopLevelComments] = useState<CommentResponse[]>([]);
  const [totalCommentCount, setTotalCommentCount] = useState<number>(0);

  useEffect(() => {
    if (!post) {
      return;
    }

    // 댓글 맵 구성 (부모 댓글 ID를 키로 하는 맵)
    const map = new Map<number, CommentResponse[]>();

    // 부모 댓글이 없는 댓글들 (최상위 댓글)
    const topLevelComments = comments.filter((c) => !c.parentCommentId);
    map.set(0, topLevelComments);

    // 대댓글들을 부모 ID별로 그룹화
    comments.forEach((comment) => {
      if (comment.parentCommentId) {
        const parentId = comment.parentCommentId;
        const replies = map.get(parentId) || [];
        map.set(parentId, [...replies, comment]);
      }
    });

    setCommentMap(map);
    setTopLevelComments(topLevelComments);
    setTotalCommentCount(comments.length);
  }, [comments, post]);

  // 댓글 작성 처리
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      return;
    }

    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const newComment = await createComment({
        postId: post!.postId!,
        content: commentText,
        parentCommentId: replyTo?.commentId || null,
      });

      // 스토어에 댓글 추가
      setComments([...comments, newComment]);

      // 댓글 수 업데이트
      updateCommentCount((post?.commentCount || 0) + 1);

      // 입력 필드 초기화
      setCommentText('');
      setReplyTo(null);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글을 작성하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 답글 작성 모드 설정
  const handleReply = (commentToReply: CommentResponse) => {
    if (!isAuthenticated) {
      <AlertLogin />;
      return;
    }
    setReplyTo(commentToReply);
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 답글 작성 취소
  const cancelReply = () => setReplyTo(null);

  // 댓글 좋아요/싫어요 처리
  // const handleVote = async (commentId: number, isLike: boolean) => {
  //   if (!isAuthenticated) {
  //     <AlertLogin />;
  //     return;
  //   }

  //   try {
  //     const updatedComment = await voteComment(commentId, { isLike });
  //     updateComment(updatedComment);
  //   } catch (error) {
  //     console.error('댓글 투표 실패:', error);
  //   }
  // };

  // 댓글 렌더링 함수
  const renderComment = (comment: CommentResponse, isReply = false) => {
    // 해당 댓글의 대댓글 가져오기
    const replies = commentMap.get(comment.commentId!) || [];

    return (
      <div
        key={comment.commentId}
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
                {comment.createdAt}
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
          <div className='mt-3 space-y-3'>{replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    );
  };

  useEffect(() => {
    console.log('댓글', comments);
    console.log('댓글 맵:', commentMap);
    console.log('최상위 댓글:', topLevelComments);
    console.log('댓글 수:', totalCommentCount);
  }, [commentMap, topLevelComments, totalCommentCount, comments]);
  return (
    <div className='p-6'>
      <h2 className='mb-4 text-lg font-medium text-gray-900'>댓글 {totalCommentCount}개</h2>

      <form
        id='comment-form'
        className='mb-6'
        onSubmit={handleSubmitComment}
      >
        {replyTo && (
          <div className='bg-blue-50 flex items-center justify-between p-3 mb-2 rounded-md'>
            <span className='text-sm text-blue-700'>
              <strong>{replyTo.author?.nickname || '익명'}</strong>님에게 답글 작성 중
            </span>
            <button
              type='button'
              onClick={cancelReply}
              className='hover:text-blue-800 text-sm text-blue-600'
            >
              취소
            </button>
          </div>
        )}
        <div className='mb-3'>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={isAuthenticated ? '댓글을 작성해주세요...' : '댓글을 작성하려면 로그인하세요...'}
            disabled={!isAuthenticated || isSubmitting}
            className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full p-3 border rounded-md ${
              isAuthenticated ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
            }`}
            rows={3}
          ></textarea>
        </div>
        <div className='flex justify-end'>
          <button
            type='submit'
            disabled={!isAuthenticated || !commentText.trim() || isSubmitting}
            className={`px-4 py-2 rounded-md transition-colors ${
              isAuthenticated && commentText.trim() && !isSubmitting
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '등록 중...' : replyTo ? '답글 등록' : '댓글 등록'}
          </button>
        </div>
      </form>

      {totalCommentCount === 0 ? (
        <div className='py-8 text-center text-gray-500'>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
      ) : (
        <div className='space-y-4'>{topLevelComments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
}
