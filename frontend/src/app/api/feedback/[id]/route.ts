import { CommentApiFactory } from '@generated/api';
import { Configuration } from '@generated/configuration';
import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    console.log('Fetching comments for post ID:', id);
    const config = new Configuration({
      basePath: apiUrl,
    });

    const commentApi = CommentApiFactory(config);
    const response = await commentApi.getCommentList({
      postId: Number(id),
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
