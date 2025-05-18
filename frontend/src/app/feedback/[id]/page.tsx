import FeedbackDetail from '@/components/feedback/detail/FeedbackDetail';
import { getComments } from '@/lib/comment-api';
import { fetchPostDetail } from '@/lib/feedback-api';
import { notFound } from 'next/navigation';

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [postResult, commentResult] = await Promise.allSettled([fetchPostDetail(id), getComments(id)]);
  const feedback = postResult.status === 'fulfilled' ? postResult.value : null;
  const comments = commentResult.status === 'fulfilled' ? commentResult.value : [];

  if (!feedback) {
    notFound();
  }

  return (
    <FeedbackDetail
      feedback={feedback}
      initialComments={comments}
    />
  );
}
