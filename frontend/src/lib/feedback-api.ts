import { getApiBaseUrl } from '@/util/serverUtil';
import {
  CreatePostRequest,
  type GetPostListResponse,
  type PostDetailResponse,
  PostOrderEnumDto,
  PostSortEnumDto,
  type PostVoteRequest,
  SearchTypeEnumDto,
  UpdatePostRequest,
  type VoteResponse,
} from '@generated/model';

/**
 * 게시글 목록을 가져오는 함수
 */
export async function fetchPosts(
  page = 0,
  size = 10,
  sort: PostSortEnumDto = PostSortEnumDto.CREATED_AT,
  order: PostOrderEnumDto = PostOrderEnumDto.DESC,
  category?: string,
  keyword?: string,
  searchType?: SearchTypeEnumDto
): Promise<GetPostListResponse> {
  // URL 파라미터 구성
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
    order: order,
    categoryId: category || '',
    keyword: keyword || '',
    type: searchType || SearchTypeEnumDto.TITLE,
  });

  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    // 내부 API 라우트로 요청 (credentials: 'include' 옵션 추가)
    const response = await fetch(`${baseUrl}/feedback?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 항상 최신 데이터를 가져옴
    });

    if (!response.ok) {
      throw new Error(`Error fetching posts: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    // 에러 발생 시 빈 응답 반환
    return { content: [], pageable: { totalPages: 0, totalElements: 0 } };
  }
}

/**
 * 게시글 상세 정보를 가져오는 함수
 */
export async function fetchPostDetail(postId: string): Promise<PostDetailResponse> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/feedback/${postId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching post detail: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch post detail for ID ${postId}:`, error);
    throw error;
  }
}

/**
 * 게시글에 투표하는 함수
 */
export async function votePost(postId: number, voteRequest: PostVoteRequest): Promise<VoteResponse> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/feedback/${postId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
      body: JSON.stringify(voteRequest),
    });

    if (!response.ok) {
      throw new Error(`Error voting post: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to vote for post ID ${postId}:`, error);
    throw error;
  }
}

/**
 * 새 게시글을 작성하는 함수
 */
export async function createPost(postData: CreatePostRequest): Promise<PostDetailResponse> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error(`Error creating post: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
}

/**
 * 게시글을 삭제하는 함수
 */
export async function deletePost(postId: number): Promise<void> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/feedback/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
    });

    if (!response.ok) {
      throw new Error(`Error deleting post: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete post ID ${postId}:`, error);
    throw error;
  }
}

/**
 * 게시글을 수정하는 함수
 */
export async function updatePost(postId: number, postData: UpdatePostRequest): Promise<PostDetailResponse> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/feedback/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error(`Error updating post: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to update post ID ${postId}:`, error);
    throw error;
  }
}

/**
 * 게시글 상태를 업데이트하는 함수
 */
export async function updatePostStatus(postId: number, status: string): Promise<void> {
  try {
    // baseUrl
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/feedback/${postId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Error updating post status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to update post ID ${postId} status:`, error);
    throw error;
  }
}
