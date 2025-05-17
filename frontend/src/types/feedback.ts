// 피드백 카테고리 타입
export type FeedbackCategory = "feature" | "bug" | "improvement" | "question";

// 피드백 상태 타입
export type FeedbackStatus = "pending" | "reviewing" | "inprogress" | "completed" | "rejected";

// 필터 타입
export type FilterType = "all" | FeedbackCategory;

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

// 카테고리 설정
export const categoryConfig: Record<FeedbackCategory, { label: string; color: string }> = {
  feature: { label: "기능 요청", color: "bg-blue-100 text-blue-800" },
  bug: { label: "버그 리포트", color: "bg-red-100 text-red-800" },
  improvement: { label: "개선 제안", color: "bg-green-100 text-green-800" },
  question: { label: "질문", color: "bg-purple-100 text-purple-800" },
};

// 상태 설정
export const statusConfig: Record<FeedbackStatus, { label: string; color: string }> = {
  pending: { label: "대기 중", color: "bg-gray-100 text-gray-800" },
  reviewing: { label: "검토 중", color: "bg-yellow-100 text-yellow-800" },
  inprogress: { label: "진행 중", color: "bg-blue-100 text-blue-800" },
  completed: { label: "완료", color: "bg-green-100 text-green-800" },
  rejected: { label: "거절됨", color: "bg-red-100 text-red-800" },
};
