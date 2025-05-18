'use client';

import { CommentResponse } from '@generated/model';

export default function FeedbackCommentForm({
  commentText,
  setCommentText,
  isAuthenticated,
  isSubmitting,
  handleSubmitComment,
  replyTo,
  cancelReply,
}: {
  commentText: string;
  setCommentText: React.Dispatch<React.SetStateAction<string>>;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  handleSubmitComment: (e: React.FormEvent) => Promise<void>;
  replyTo: CommentResponse | null;
  cancelReply: () => void;
}) {
  return (
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
  );
}
