'use client';

import useAuthStore from '@/app/store/useAuthStore';
import { votePost } from '@/lib/feedback-api';
import type { CommentResponse, GetCommentListResponse, PostDetailResponse, VoteResponse } from '@generated/model';
import { ArrowLeft, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// 카테고리 레이블 및 색상 매핑
const categoryConfig: Record<string, { label: string; color: string }> = {
  feature: { label: '기능 요청', color: 'bg-blue-100 text-blue-800' },
  bug: { label: '버그 리포트', color: 'bg-red-100 text-red-800' },
  improvement: { label: '개선 제안', color: 'bg-green-100 text-green-800' },
  question: { label: '질문', color: 'bg-purple-100 text-purple-800' },
};

// 상태 레이블 및 색상 매핑
// const statusConfig: Record<string, { label: string; color: string }> = {
//   pending: { label: '대기 중', color: 'bg-gray-100 text-gray-800' },
//   reviewing: { label: '검토 중', color: 'bg-yellow-100 text-yellow-800' },
//   inprogress: { label: '진행 중', color: 'bg-blue-100 text-blue-800' },
//   completed: { label: '완료', color: 'bg-green-100 text-green-800' },
//   rejected: { label: '거절됨', color: 'bg-red-100 text-red-800' },
// };

export default function FeedbackDetail({
  feedback,
  initialComments,
}: {
  feedback: PostDetailResponse;
  initialComments?: GetCommentListResponse;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [post, setPost] = useState<PostDetailResponse>(feedback);
  const [comments] = useState<CommentResponse[]>(initialComments?.content || []);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<CommentResponse | null>(null);

  // 투표 처리 함수
  const handleVote = async (isLike: boolean) => {
    // 로그인하지 않은 경우 로그인 페이지로 이동
    if (!isAuthenticated) {
      router.push(`/login?redirect=/feedback/${post.postId}`);
      return;
    }

    try {
      const response = await votePost(post.postId!, { isLike });
      updateVoteCounts(response);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // 투표 수 업데이트 함수
  const updateVoteCounts = (voteResponse: VoteResponse) => {
    setPost((prev) => ({
      ...prev,
      likeCount: voteResponse.likeCount,
      dislikeCount: voteResponse.dislikeCount,
    }));
  };

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

  // 대댓글 작성 시작
  const handleReply = (commentToReply: CommentResponse) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/feedback/${post.postId}`);
      return;
    }

    setReplyTo(commentToReply);
    // 댓글 입력 필드로 스크롤
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 대댓글 작성 취소
  const cancelReply = () => {
    setReplyTo(null);
  };

  // 댓글 렌더링 함수
  const renderComment = (comment: CommentResponse, isReply = false) => (
    <div
      key={comment.commentId}
      className={`p-4 rounded-lg ${isReply ? 'ml-8 mt-3' : 'mb-4'} `}
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

      <div className='mb-3 text-gray-700'>{comment.content}</div>

      <div className='flex items-center gap-4'>
        {/* 좋아요/싫어요 버튼 */}
        <div className='flex items-center gap-3'>
          <button
            // onClick={() => handleCommentVote(comment.commentId!, true)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated ? 'text-gray-500 hover:text-blue-600' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
          >
            <ThumbsUp className='w-4 h-4' />
            <span>{comment.likeCount || 0}</span>
          </button>
          <button
            // onClick={() => handleCommentVote(comment.commentId!, false)}
            className={`flex items-center gap-1 text-sm ${
              isAuthenticated ? 'text-gray-500 hover:text-red-600' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
          >
            <ThumbsDown className='w-4 h-4' />
            <span>{comment.dislikeCount || 0}</span>
          </button>
        </div>

        {/* 답글 버튼 */}
        {!isReply && (
          <button
            onClick={() => handleReply(comment)}
            className={`text-sm ${
              isAuthenticated ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isAuthenticated}
          >
            답글 달기
          </button>
        )}
      </div>

      {/* 대댓글 목록 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className='mt-3 space-y-3'>{comment.replies.map((reply) => renderComment(reply, true))}</div>
      )}
    </div>
  );

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='md:py-20 max-w-4xl px-6 py-8 mx-auto'>
        {/* 뒤로 가기 링크 */}
        <div
          onClick={() => router.back()}
          className='hover:text-blue-600 inline-flex items-center gap-1 mb-6 text-gray-600 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>피드백 목록으로 돌아가기</span>
        </div>

        <div className='rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm'>
          {/* 피드백 헤더 */}
          <div className='p-6 border-b border-gray-100'>
            <div className='flex items-center justify-between mb-4'>
              <h1 className='text-2xl font-bold text-gray-900'>{post.title}</h1>
              {post.category && categoryConfig[post.category] && (
                <span className={`text-sm px-3 py-1 rounded-full ${categoryConfig[post.category].color}`}>
                  {categoryConfig[post.category].label}
                </span>
              )}
            </div>

            {/* 작성자 정보 */}
            {post.author && (
              <div className='flex items-center gap-3 mb-4'>
                <div className='relative w-10 h-10 overflow-hidden bg-gray-200 rounded-full'>
                  {post.author.profileImgUrl ? (
                    <Image
                      src={post.author.profileImgUrl || '/placeholder.svg'}
                      alt={post.author.nickname || '사용자'}
                      width={40}
                      height={40}
                      className='object-cover'
                    />
                  ) : (
                    <div className='flex items-center justify-center w-full h-full text-gray-500'>
                      {post.author.nickname?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div className='font-medium text-gray-900'>{post.author.nickname}</div>
                  <div className='text-sm text-gray-500'>
                    {post.createdAt}
                    {post.updatedAt !== post.createdAt && ' (수정됨)'}
                  </div>
                </div>
              </div>
            )}

            {/* 조회수 및 투표 정보 */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4 text-sm text-gray-500'>
                <span>조회 {post.viewCount}</span>
                <div className='flex items-center gap-1'>
                  <ThumbsUp className='w-4 h-4' />
                  <span>{post.likeCount}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <ThumbsDown className='w-4 h-4' />
                  <span>{post.dislikeCount}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <MessageSquare className='w-4 h-4' />
                  <span>{post.commentCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 피드백 내용 */}
          <div className='p-6 border-b border-gray-100'>
            <div className='max-w-none prose'>
              {post.content?.split('\n').map((paragraph, idx) => (
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
            <div className='flex items-center justify-center gap-4'>
              <button
                onClick={() => handleVote(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isAuthenticated
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
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
                  isAuthenticated
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isAuthenticated}
                title={isAuthenticated ? '싫어요' : '싫어요하려면 로그인하세요'}
              >
                <ThumbsDown className='w-5 h-5' />
                <span>싫어요 {post.dislikeCount}</span>
              </button>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className='p-6'>
            <h2 className='mb-4 text-lg font-medium text-gray-900'>댓글 {post.commentCount}</h2>

            {/* 댓글 작성 폼 */}
            <form
              id='comment-form'
              // onSubmit={handleCommentSubmit}
              className='mb-6'
            >
              {replyTo && (
                <div className='bg-blue-50 flex items-center justify-between p-2 mb-2 rounded-md'>
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isAuthenticated ? '댓글을 작성해주세요...' : '댓글을 작성하려면 로그인하세요...'}
                  disabled={!isAuthenticated || isSubmitting}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full p-3 border border-gray-200 rounded-md'
                  rows={3}
                ></textarea>
              </div>
              <div className='flex justify-end'>
                <button
                  type='submit'
                  disabled={!isAuthenticated || !comment.trim() || isSubmitting}
                  className={`px-4 py-2 rounded-md ${
                    isAuthenticated && comment.trim() && !isSubmitting
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? '등록 중...' : replyTo ? '답글 등록' : '댓글 등록'}
                </button>
              </div>
            </form>

            {/* 댓글 목록 */}
            {comments.length === 0 ? (
              <div className='py-8 text-center text-gray-500'>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
            ) : (
              <div className='space-y-4'>
                {comments.filter((c) => !c.parentCommentId).map((comment) => renderComment(comment))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
