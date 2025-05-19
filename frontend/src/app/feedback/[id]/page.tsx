import FeedbackDetail from '@/components/feedback/detail/FeedbackDetail';
import { fetchPostDetail } from '@/lib/feedback-api';
import { notFound } from 'next/navigation';

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedback = await fetchPostDetail(id);

  if (!feedback) {
    notFound();
  }

  return <FeedbackDetail feedback={feedback} />;
}
