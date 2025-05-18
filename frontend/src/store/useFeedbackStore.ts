// store/useFeedbackStore.ts
import { CommentResponse, PostDetailResponse } from '@generated/model';
import { create } from 'zustand';

interface FeedbackState {
  post: PostDetailResponse | null;
  setPost: (post: PostDetailResponse) => void;
  updateVoteCounts: (like: number, dislike: number) => void;
  updateCommentCount: (comment: number) => void;
  resetFeedback: () => void;
  comments: CommentResponse[] | [];
  setComments: (comments: CommentResponse[]) => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  post: null,
  setPost: (post) => set({ post }),

  updateVoteCounts: (like, dislike) =>
    set((state) =>
      state.post
        ? {
            post: {
              ...state.post,
              likeCount: like,
              dislikeCount: dislike,
            },
          }
        : state
    ),

  updateCommentCount: (comment) =>
    set((state) =>
      state.post
        ? {
            post: {
              ...state.post,
              commentCount: comment,
            },
          }
        : state
    ),

  resetFeedback: () => set({ post: null }),

  comments: [],
  setComments: (comments) => set({ comments }),
}));
