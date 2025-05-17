import FeedbackDetail from "@/components/feedback/FeedbackDetail";
import { getComments } from "@/lib/comment-api";
import { fetchPostDetail } from "@/lib/feedback-api";
import { Suspense } from "react";

// 로딩 상태 표시 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin border-t-transparent w-10 h-10 border-4 border-blue-500 rounded-full"></div>
    </div>
  );
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [feedback, comments] = await Promise.all([fetchPostDetail(id), getComments(id)]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <FeedbackDetail
        feedback={feedback}
        initialComments={comments}
      />
    </Suspense>
  );
}
