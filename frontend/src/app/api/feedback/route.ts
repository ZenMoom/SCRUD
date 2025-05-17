import { PostApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { PostOrderEnumDto, PostSortEnumDto, SearchTypeEnumDto } from '@generated/model';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

// API 기본 URL 설정
const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

/**
 * 게시글 목록 조회 API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const config = new Configuration({
      basePath: apiUrl,
    });

    const postApi = PostApiFactory(config);
    const response = await postApi.getPostList({
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      size: searchParams.get('size') ? Number(searchParams.get('size')) : undefined,
      sort: (searchParams.get('sort') as PostSortEnumDto) || undefined,
      order: (searchParams.get('order') as PostOrderEnumDto) || undefined,
      keyword: searchParams.get('keyword') || undefined,
      type: (searchParams.get('type') as SearchTypeEnumDto) || undefined,
      categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('[GET] /api/feedback/posts error:', error);
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * 게시글 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = (await cookies()).get('access_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('[POST] /api/feedback/posts error:', error);
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage || 'Internal Server Error' }, { status: 500 });
  }
}
