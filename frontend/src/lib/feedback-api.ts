import {
  type GetPostListResponse,
  type PostDetailResponse,
  PostOrderEnumDto,
  PostSortEnumDto,
  type PostVoteRequest,
  SearchTypeEnumDto,
  type VoteResponse,
} from "@generated/model";

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
    keyword: keyword || "",
    type: searchType || SearchTypeEnumDto.TITLE,
  });

  // 카테고리가 있으면 추가
  if (category && category !== "all") {
    params.append("category", category);
  }

  try {
    // 내부 API 라우트로 요청 (credentials: 'include' 옵션 추가)
    const response = await fetch(`/api/feedback?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      cache: "no-store", // 항상 최신 데이터를 가져옴
    });

    if (!response.ok) {
      throw new Error(`Error fetching posts: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    // 에러 발생 시 빈 응답 반환
    return { content: [], pageable: { totalPages: 0, totalElements: 0 } };
  }
}

/**
 * 게시글 상세 정보를 가져오는 함수
 */
export async function fetchPostDetail(postId: number): Promise<PostDetailResponse> {
  try {
    const response = await fetch(`/api/feedback/posts/${postId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      cache: "no-store",
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
    const response = await fetch(`/api/feedback/posts/${postId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
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
export async function createPost(postData: {
  title: string;
  content: string;
  category: number;
}): Promise<PostDetailResponse> {
  try {
    const response = await fetch(`/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error(`Error creating post: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
}

/**
 * 게시글을 삭제하는 함수
 */
export async function deletePost(postId: number): Promise<void> {
  try {
    const response = await fetch(`/api/feedback/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 쿠키 포함
    });

    if (!response.ok) {
      throw new Error(`Error deleting post: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to delete post ID ${postId}:`, error);
    throw error;
  }
}
