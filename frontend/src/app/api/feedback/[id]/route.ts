import { CommentApiFactory } from '@generated/api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const commentApi = CommentApiFactory();
    const response = await commentApi.getCommentList({
      postId: Number(id),
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
