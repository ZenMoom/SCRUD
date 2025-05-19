import { getApiBaseUrl } from '@/util/serverUtil';
import { CommentResponse } from '@generated/model';

/**
 * 게시글 댓글 조회하는 함수
 */
export async function getComments(postId: string): Promise<CommentResponse[]> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/comment/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching comments for post ID ${postId}: ${response.status}`);
    }

    console.log('getComments response:', response);

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch comments for post ID ${postId}:`, error);
    return [] as CommentResponse[]; // 에러 발생 시 빈 배열 반환
  }
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
