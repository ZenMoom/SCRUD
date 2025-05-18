'use client';

import { useFeedbackStore } from '@/store/useFeedbackStore';
import type { CommentResponse, PostDetailResponse } from '@generated/model';
import { useEffect } from 'react';
import FeedbackBackButton from '../FeedbackBackButton';
import FeedbackComment from '../comment/FeedbackComment';
import { FeedbackHeader } from './FeedbackHeader';
import FeedbackVote from './FeedbackVote';

// 상태 레이블 및 색상 매핑
// const statusConfig: Record<string, { label: string; color: string }> = {
//   pending: { label: '대기 중', color: 'bg-gray-100 text-gray-800' },
//   reviewing: { label: '검토 중', color: 'bg-yellow-100 text-yellow-800' },
//   inprogress: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
//   completed: { label: '완료', color: 'bg-green-100 text-green-800' },
//   rejected: { label: '거절됨', color: 'bg-red-100 text-red-800' },
// };

// 피드백 헤더

export default function FeedbackDetail({
  feedback,
  initialComments,
}: {
  feedback: PostDetailResponse;
  initialComments: CommentResponse[];
}) {
  const { post, setPost, setComments } = useFeedbackStore();

  useEffect(() => {
    setPost(feedback);
    setComments(initialComments);
  }, [feedback, setPost, initialComments, setComments]);

  // // 댓글 투표 처리 함수
  // const handleCommentVote = async (commentId: number, isLike: boolean) => {
  //   if (!isAuthenticated) {
  //     router.push(`/login?redirect=/feedback/${post.postId}`);
  //     return;
  //   }

  //   try {
  //     const response = await voteComment(commentId, { isLike });

  //     // 댓글 목록 업데이트
  //     setComments((prevComments) =>
  //       prevComments.map((c) => {
  //         if (c.commentId === commentId) {
  //           return {
  //             ...c,
  //             likeCount: response.likeCount,
  //             dislikeCount: response.dislikeCount,
  //           };
  //         }
  //         return c;
  //       })
  //     );
  //   } catch (error) {
  //     console.error("Error voting on comment:", error);
  //   }
  // };

  // 댓글 제출 함수
  // const handleCommentSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // 로그인하지 않은 경우 로그인 페이지로 이동
  //   if (!isAuthenticated) {
  //     router.push(`/login?redirect=/feedback/${post.postId}`);
  //     return;
  //   }

  //   if (!comment.trim()) return;

  //   setIsSubmitting(true);

  //   try {
  //     const newComment = await createComment({
  //       postId: post.postId!,
  //       content: comment,
  //       parentCommentId: replyTo?.commentId || null,
  //     });

  //     // 댓글 목록 업데이트
  //     if (replyTo && replyTo.commentId) {
  //       // 대댓글인 경우
  //       setComments((prevComments) =>
  //         prevComments.map((c) => {
  //           if (c.commentId === replyTo.commentId) {
  //             return {
  //               ...c,
  //               replies: [...(c.replies || []), newComment],
  //             };
  //           }
  //           return c;
  //         })
  //       );
  //     } else {
  //       // 일반 댓글인 경우
  //       setComments((prevComments) => [...prevComments, newComment]);
  //     }

  //     // 댓글 수 업데이트
  //     setPost((prev) => ({
  //       ...prev,
  //       commentCount: (prev.commentCount || 0) + 1,
  //     }));

  //     // 입력 필드 초기화
  //     setComment("");
  //     setReplyTo(null);
  //   } catch (error) {
  //     console.error("Error creating comment:", error);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='md:py-20 max-w-4xl px-6 py-8 mx-auto'>
        {/* 뒤로 가기 링크 */}
        <FeedbackBackButton description='피드백 목록으로 돌아가기' />

        <div className='rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm'>
          {/* 피드백 헤더 */}
          <div className='p-6 border-b border-gray-100'>
            <FeedbackHeader />
          </div>

          {/* 피드백 내용 */}
          <div className='p-6 border-b border-gray-100'>
            <div className='max-w-none prose'>
              {post &&
                post.content?.split('\n').map((paragraph, idx) => (
                  <p
                    key={idx}
                    className='mb-4 text-gray-700'
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>

          {/* 투표 버튼 */}
          <div className='p-6 border-b border-gray-100'>
            <FeedbackVote />
          </div>

          {/* 댓글 세션 */}
          <FeedbackComment />
        </div>
      </div>
    </div>
  );
}
