/**
 * 게시글 댓글 조회하는 함수
 */

import { GetCommentListResponse } from '@generated/model';

export async function getComments(postId: string): Promise<GetCommentListResponse> {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching comments for post ID ${postId}: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch comments for post ID ${postId}:`, error);
    return [] as GetCommentListResponse;
  }
}
