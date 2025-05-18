import { getApiBaseUrl } from '@/app/utils/serverUtil';
import { GetCommentListResponse } from '@generated/model';

/**
 * 게시글 댓글 조회하는 함수 server-side에서 사용
 */
export async function getComments(postId: string): Promise<GetCommentListResponse> {
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

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch comments for post ID ${postId}:`, error);
    return [] as GetCommentListResponse;
  }
}
