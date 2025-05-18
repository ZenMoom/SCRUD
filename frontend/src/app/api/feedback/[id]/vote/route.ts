import { PostApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { PostVoteRequest } from '@generated/model';
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

    console.log('body:', body);
    const postApi = PostApiFactory(config);
    const response = await postApi.votePost({
      postId: Number(id),
      postVoteRequest: {
        isLike: body.isLike,
      } as PostVoteRequest,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
