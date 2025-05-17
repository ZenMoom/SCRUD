import FeedbackBoard from "@/components/feedback/FeedbackBoard";
import { fetchPosts } from "@/lib/feedback-api";
import { PostOrderEnumDto, PostSortEnumDto } from "@generated/model";
import type React from "react";
import { Suspense } from "react";

// 로딩 상태 표시 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin border-t-transparent w-10 h-10 border-4 border-blue-500 rounded-full"></div>
    </div>
  );
}

// 서버 컴포넌트에서 데이터 페칭
async function FeedbackPageContent({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    size?: string;
    sort?: PostSortEnumDto;
    order?: PostOrderEnumDto;
    category?: string;
  };
}) {
  // URL 쿼리 파라미터에서 값 추출
  const page = searchParams?.page ? Number.parseInt(searchParams.page) - 1 : 0; // 페이지는 0부터 시작하므로 -1
  const size = searchParams?.size ? Number.parseInt(searchParams.size) : 10;
  const sort = searchParams?.sort || PostSortEnumDto.CREATED_AT;
  const order = searchParams?.order || PostOrderEnumDto.DESC;
  const category = searchParams?.category;

  // 데이터 페칭
  const postsData = await fetchPosts(page, size, sort, order, category);
  return <FeedbackBoard postsData={postsData} />;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    size?: string;
    sort?: PostSortEnumDto;
    order?: PostOrderEnumDto;
    category?: string;
  };
}): Promise<React.ReactNode> {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FeedbackPageContent searchParams={searchParams} />
    </Suspense>
  );
}
