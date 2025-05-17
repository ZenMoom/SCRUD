import { Configuration } from '@generated/configuration';
import { NextResponse } from 'next/server';
import { CommentApiFactory } from './../../../../../generated/api/comment-api';

// API 기본 URL 설정
const apiUrl = process.env.NEXT_PRIVATE_API_BASE_URL;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
