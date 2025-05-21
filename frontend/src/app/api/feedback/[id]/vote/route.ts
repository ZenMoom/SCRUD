import { PostApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { PostVoteRequest } from '@generated/model';
import { AxiosError } from 'axios';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const authToken = (await cookies()).get('access_token')?.value;

    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    const postApi = PostApiFactory(config);
    const response = await postApi.votePost({
      postId: Number(id),
      postVoteRequest: {
        isLike: body.isLike,
      } as PostVoteRequest,
    });
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error creating comment:', error);

    const axiosError = error as AxiosError<{ message: string }>;
    const message = axiosError.response?.data?.message ?? 'An error occurred';
    const status = axiosError.response?.status ?? 500;

    return NextResponse.json({ error: message }, { status });
  }
}
