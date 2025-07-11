import { getApiBaseUrl } from '@/util/serverUtil';
import { CommentResponse } from '@generated/model';

/**
 * 게시글 댓글 조회하는 함수
 */
export async function getComments(postId: string): Promise<CommentResponse[]> {
  // baseUrl
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/comment/${postId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
  });

  if (!response.ok) {
    console.error(`Failed to fetch comments for post ID ${postId}`);
    return [] as CommentResponse[]; // 에러 발생 시 빈 배열 반환
  }

  return await response.json();
}

/**
 * 댓글 작성하는 함수
 */
export async function createComment({
  postId,
  content,
  parentCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId: number | null;
}): Promise<CommentResponse> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/comment/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content,
        parentCommentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating comment: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
}

/**
 * 댓글 삭제하는 함수
 */
export async function deleteComment(commentId: number) {
  // baseUrl
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/comment/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '댓글 삭제 중 오류가 발생했습니다.');
  }

  return response.json();
}

/**
 * 댓글 수정하는 함수
 */
export async function updateComment(commentId: number, content: string) {
  // baseUrl
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/comment/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '댓글 수정 중 오류가 발생했습니다.');
  }

  return response.json();
}

/**
 * 댓글에 좋아요/싫어요 처리하는 함수
 */
export async function commentVote(commentId: number, isLike: boolean) {
  // baseUrl
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/comment/${commentId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ isLike }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '댓글 투표 중 오류가 발생했습니다.');
  }

  return response.json();
}
