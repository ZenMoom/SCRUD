import { PostApiFactory } from "@generated/api";
import { Configuration } from "@generated/configuration";
import { PostOrderEnumDto, PostSortEnumDto, SearchTypeEnumDto } from "@generated/model";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// API 기본 URL 설정
const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

const dummyData = {
  content: [
    {
      postId: 1,
      title: "더미 피드백 1",
      category: "feature",
      createdAt: "2025-05-16T07:57:40.045753",
      viewCount: 114,
      likeCount: 34,
      commentCount: 30,
    },
    {
      postId: 2,
      title: "더미 피드백 2",
      category: "question",
      createdAt: "2025-05-15T07:57:40.045798",
      viewCount: 400,
      likeCount: 1,
      commentCount: 17,
    },
    {
      postId: 3,
      title: "더미 피드백 3",
      category: "feature",
      createdAt: "2025-05-14T07:57:40.045820",
      viewCount: 214,
      likeCount: 48,
      commentCount: 20,
    },
    {
      postId: 4,
      title: "더미 피드백 4",
      category: "improvement",
      createdAt: "2025-05-13T07:57:40.045832",
      viewCount: 257,
      likeCount: 18,
      commentCount: 22,
    },
    {
      postId: 5,
      title: "더미 피드백 5",
      category: "question",
      createdAt: "2025-05-12T07:57:40.045839",
      viewCount: 379,
      likeCount: 14,
      commentCount: 24,
    },
    {
      postId: 6,
      title: "더미 피드백 6",
      category: "question",
      createdAt: "2025-05-11T07:57:40.045846",
      viewCount: 400,
      likeCount: 73,
      commentCount: 21,
    },
    {
      postId: 7,
      title: "더미 피드백 7",
      category: "question",
      createdAt: "2025-05-10T07:57:40.045853",
      viewCount: 76,
      likeCount: 52,
      commentCount: 2,
    },
    {
      postId: 8,
      title: "더미 피드백 8",
      category: "question",
      createdAt: "2025-05-09T07:57:40.045862",
      viewCount: 105,
      likeCount: 95,
      commentCount: 5,
    },
    {
      postId: 9,
      title: "더미 피드백 9",
      category: "question",
      createdAt: "2025-05-08T07:57:40.045870",
      viewCount: 241,
      likeCount: 33,
      commentCount: 13,
    },
    {
      postId: 10,
      title: "더미 피드백 10",
      category: "question",
      createdAt: "2025-05-07T07:57:40.045878",
      viewCount: 441,
      likeCount: 59,
      commentCount: 16,
    },
    {
      postId: 11,
      title: "더미 피드백 11",
      category: "feature",
      createdAt: "2025-05-06T07:57:40.045884",
      viewCount: 115,
      likeCount: 75,
      commentCount: 21,
    },
    {
      postId: 12,
      title: "더미 피드백 12",
      category: "improvement",
      createdAt: "2025-05-05T07:57:40.045889",
      viewCount: 364,
      likeCount: 52,
      commentCount: 4,
    },
    {
      postId: 13,
      title: "더미 피드백 13",
      category: "feature",
      createdAt: "2025-05-04T07:57:40.045896",
      viewCount: 481,
      likeCount: 6,
      commentCount: 23,
    },
    {
      postId: 14,
      title: "더미 피드백 14",
      category: "question",
      createdAt: "2025-05-03T07:57:40.045902",
      viewCount: 189,
      likeCount: 74,
      commentCount: 27,
    },
    {
      postId: 15,
      title: "더미 피드백 15",
      category: "question",
      createdAt: "2025-05-02T07:57:40.045907",
      viewCount: 495,
      likeCount: 10,
      commentCount: 11,
    },
    {
      postId: 16,
      title: "더미 피드백 16",
      category: "improvement",
      createdAt: "2025-05-01T07:57:40.045913",
      viewCount: 88,
      likeCount: 39,
      commentCount: 20,
    },
    {
      postId: 17,
      title: "더미 피드백 17",
      category: "bug",
      createdAt: "2025-04-30T07:57:40.045919",
      viewCount: 196,
      likeCount: 31,
      commentCount: 28,
    },
    {
      postId: 18,
      title: "더미 피드백 18",
      category: "feature",
      createdAt: "2025-04-29T07:57:40.045926",
      viewCount: 458,
      likeCount: 81,
      commentCount: 1,
    },
    {
      postId: 19,
      title: "더미 피드백 19",
      category: "feature",
      createdAt: "2025-04-28T07:57:40.045932",
      viewCount: 126,
      likeCount: 87,
      commentCount: 0,
    },
    {
      postId: 20,
      title: "더미 피드백 20",
      category: "question",
      createdAt: "2025-04-27T07:57:40.045938",
      viewCount: 195,
      likeCount: 50,
      commentCount: 1,
    },
  ],
  pageable: {
    listSize: 10,
    isFirstPage: true,
    isLastPage: true,
    totalPages: 2,
    totalElements: 20,
  },
};

/**
 * 게시글 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const config = new Configuration({
      basePath: apiUrl,
    });
    // 더미 데이터 반환
    const page = Number(searchParams.get("page") || "0");
    const size = Number(searchParams.get("size") || "10");

    const filtered = [...dummyData.content]; // 검색/정렬도 여기서 할 수 있음

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);

    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);

    return NextResponse.json({
      content: paginated,
      pageable: {
        listSize: paginated.length,
        isFirstPage: page === 0,
        isLastPage: page >= totalPages - 1,
        totalPages,
        totalElements,
      },
    });
    // 임시 데이터 반환 끝

    const postApi = PostApiFactory(config);
    const response = await postApi.getPostList({
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      size: searchParams.get("size") ? Number(searchParams.get("size")) : undefined,
      sort: (searchParams.get("sort") as PostSortEnumDto) || undefined,
      order: (searchParams.get("order") as PostOrderEnumDto) || undefined,
      keyword: searchParams.get("keyword") || undefined,
      type: (searchParams.get("type") as SearchTypeEnumDto) || undefined,
      categoryId: searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined,
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[GET] /api/feedback/posts error:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? (error as { message?: string }).message
        : "Internal Server Error";
    return NextResponse.json({ error: errorMessage || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 게시글 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = (await cookies()).get("access_token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    const postApi = PostApiFactory(config);
    const response = await postApi.createPost({ createPostRequest: body });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("[POST] /api/feedback/posts error:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? (error as { message?: string }).message
        : "Internal Server Error";
    return NextResponse.json({ error: errorMessage || "Internal Server Error" }, { status: 500 });
  }
}
