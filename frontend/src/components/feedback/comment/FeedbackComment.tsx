'use client';

import type React from 'react';

import useAuthStore from '@/app/store/useAuthStore';
import AlertLogin from '@/components/alert/AlertLogin';
import { createComment, getComments } from '@/lib/comment-api';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse } from '@generated/model';
import { useEffect, useState } from 'react';
import FeedbackCommentForm from './FeedbackCommentForm';
import FeedbackCommentItem from './FeedbackCommentItem';

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
      await createComment({
        postId: post!.postId!,
        content: commentText,
        parentCommentId: replyTo?.commentId || null,
      });

      // 댓글 목록 업데이트
      const updatedComments = await getComments(String(post!.postId!));

      setComments(updatedComments); // 스토어에 반영
      updateCommentCount(updatedComments.length); // 댓글 수도 갱신

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

  return (
    <div className='p-6'>
      <h2 className='mb-4 text-lg font-medium text-gray-900'>댓글 {totalCommentCount}개</h2>

      {/* 댓글 작성 폼 */}
      <FeedbackCommentForm
        cancelReply={cancelReply}
        commentText={commentText}
        setCommentText={setCommentText}
        isAuthenticated={isAuthenticated}
        isSubmitting={isSubmitting}
        handleSubmitComment={handleSubmitComment}
        replyTo={replyTo}
      />

      {totalCommentCount === 0 ? (
        <div className='py-8 text-center text-gray-500'>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
      ) : (
        <div className='space-y-4'>
          {topLevelComments.map((comment) => (
            <FeedbackCommentItem
              key={comment.commentId}
              comment={comment}
              isReply={false}
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
