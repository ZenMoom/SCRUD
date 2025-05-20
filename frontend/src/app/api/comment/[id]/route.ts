import { CommentApiCreateCommentRequest, CommentApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { CreateCommentRequest, UpdateCommentRequest } from '@generated/model';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }
  const authToken = (await cookies()).get('access_token')?.value;
  try {
    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    const commentApi = CommentApiFactory(config);

    const response = await commentApi.getCommentList({
      postId: Number(id),
    });

    return NextResponse.json(response.data.content);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

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

    const config = new Configuration({
      basePath: apiUrl,
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
    const commentApi = CommentApiFactory(config);

    const body = await request.json();
    const createCommentRequest: CreateCommentRequest = {
      content: body.content,
      parentCommentId: body.parentCommentId ? Number(body.parentCommentId) : undefined,
    };

    const response = await commentApi.createComment({
      postId: Number(id),
      createCommentRequest,
    } as CommentApiCreateCommentRequest);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

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
    const commentApi = CommentApiFactory(config);

    await commentApi.deleteComment({
      commentId: Number(id),
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
  }

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
    const commentApi = CommentApiFactory(config);

    const body = await request.json();

    const response = await commentApi.updateComment({
      commentId: Number(id),
      updateCommentRequest: body.content as UpdateCommentRequest,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
