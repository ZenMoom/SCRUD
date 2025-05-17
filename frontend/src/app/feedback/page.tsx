import FeedbackBoard from '@/components/feedback/FeedbackBoard';
import { fetchPosts } from '@/lib/feedback-api';
import { PostOrderEnumDto, PostSortEnumDto } from '@generated/model';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    sort?: PostSortEnumDto;
    order?: PostOrderEnumDto;
    category?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page) - 1 : 0;
  const size = resolvedSearchParams?.size ? parseInt(resolvedSearchParams.size) : 10;
  const sort = resolvedSearchParams?.sort ?? PostSortEnumDto.CREATED_AT;
  const order = resolvedSearchParams?.order ?? PostOrderEnumDto.DESC;
  const category = resolvedSearchParams?.category ?? '';

  const posts = await fetchPosts(page, size, sort, order, category);

  return <FeedbackBoard postsData={posts} />;
}
