// 피드백 카테고리 타입
export type FeedbackCategory = 'feature' | 'bug' | 'improvement' | 'question' | 'notice';

// 피드백 상태 타입
export type FeedbackStatus = 'pending' | 'reviewing' | 'inprogress' | 'completed' | 'rejected';

// 필터 타입
export type FilterType = 'all' | FeedbackCategory;

// 피드백 타입
export interface Feedback {
  id: string;
  title: string;
  content: string;
  author: string;
  authorImg?: string;
  createdAt: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  votes: number;
  downvotes: number;
  comments: number;
}

// 카테고리 레이블 및 색상 매핑
export const categoryConfig: Record<string, { label: string; color: string; number: string }> = {
  feature: { label: '기능 요청', color: 'bg-blue-100 text-blue-800', number: '1' },
  bug: { label: '버그 리포트', color: 'bg-red-100 text-red-800', number: '2' },
  improvement: { label: '개선 제안', color: 'bg-green-100 text-green-800', number: '3' },
  question: { label: '질문', color: 'bg-purple-100 text-purple-800', number: '4' },
  notice: { label: '공지사항', color: 'bg-yellow-100 text-yellow-800', number: '5' },
};

// 숫자로 카테고리 조회를 위한 매핑
export const numberToCategoryMap: Record<string, string> = {
  '1': 'feature',
  '2': 'bug',
  '3': 'improvement',
  '4': 'question',
  '5': 'notice',
};
