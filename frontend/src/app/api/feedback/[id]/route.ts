import { PostApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { UpdatePostRequest } from '@generated/model';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const config = new Configuration({
      basePath: apiUrl,
    });

    const postApi = PostApiFactory(config);
    const response = await postApi.getPostById({
      postId: Number(id),
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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
    const response = await postApi.updatePost({
      postId: Number(id),
      updatePostRequest: body as UpdatePostRequest,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
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
    await postApi.deletePost({
      postId: Number(id),
    });

    return NextResponse.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
