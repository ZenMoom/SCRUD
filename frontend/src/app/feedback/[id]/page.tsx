import FeedbackDetail from '@/components/feedback/FeedbackDetail';
import { getComments } from '@/lib/comment-api';
import { fetchPostDetail } from '@/lib/feedback-api';

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [feedback, comments] = await Promise.all([fetchPostDetail(id), getComments(id)]);

  return (
    <FeedbackDetail
      feedback={feedback}
      initialComments={comments}
    />
  );
}
