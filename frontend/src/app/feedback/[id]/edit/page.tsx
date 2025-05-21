import FeedbackEditForm from '@/components/feedback/edit/FeedbackEditForm';
import { fetchPostDetail } from '@/lib/feedback-api';

export default async function FeedbackEditPage({ params }: { params: Promise<{ id: string }> }) {
  // 서버에서 피드백 데이터 가져오기
  const postId = (await params).id;
  const post = await fetchPostDetail(postId);

  return (
    <div className='bg-gradient-to-b from-white to-gray-50 min-h-screen'>
      <div className='md:py-16 max-w-3xl px-6 py-8 mx-auto'>
        <h1 className='mb-8 text-3xl font-bold text-gray-800'>피드백 수정</h1>
        <FeedbackEditForm post={post} />
      </div>
    </div>
  );
}
