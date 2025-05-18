import FeedbackDetail from '@/components/feedback/detail/FeedbackDetail';
import { getComments } from '@/lib/comment-api';
import { fetchPostDetail } from '@/lib/feedback-api';
import { notFound } from 'next/navigation';

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [feedback, comments] = await Promise.all([fetchPostDetail(id), getComments(id)]);

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
