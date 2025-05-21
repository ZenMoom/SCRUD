import { formatToKST } from '@/util/dayjs';
import { PostApiFactory, PostApiUpdatePostStatusRequest } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { PostStatusEnumDto } from '@generated/model';
import axios from 'axios';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;
/**
 * 게시글 상태 업데이트 API
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const postId = (await context.params).id;

  try {
    const authToken = (await cookies()).get('access_token')?.value;

    const { status } = await request.json();

    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    const postApi = PostApiFactory(config);
    const response = await postApi.updatePostStatus({
      postId: Number(postId),
      updatePostStatusRequest: { status: status as PostStatusEnumDto },
    } as PostApiUpdatePostStatusRequest);

    const data = response.data;
    return NextResponse.json(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(formatToKST(new Date().toISOString()), 'Error updating post status:', error.response?.data);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
