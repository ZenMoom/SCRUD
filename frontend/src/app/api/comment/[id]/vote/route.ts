import { CommentApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const authToken = (await cookies()).get('access_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { isLike } = await request.json();
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    const commentApi = CommentApiFactory(config);
    const response = await commentApi.voteComment({
      commentId: Number(id),
      commentVoteRequest: {
        isLike,
      },
    });
    console.log('response', response);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error?.response?.data?.message || 'An error occurred' },
      { status: error?.status || 500 }
    );
  }
}
